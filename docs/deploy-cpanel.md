# Deploying to Domainesia cPanel

GitHub Actions builds, cPanel only copies. That split exists because `next build`
peaks well above the 1-2GB a shared plan gives you, so building on the server
gets the process killed partway through with no useful error.

```
push to main  ->  Actions builds both apps  ->  force-push to `deploy` branch
                                                        |
                                          cPanel Git Version Control pulls
                                                        |
                                     .cpanel.yml copies files + restarts Passenger
```

The `deploy` branch is a build artifact, not history. It is overwritten every
run and you should never commit to it by hand.

## One-time server setup

### 1. Create the two Node.js apps

cPanel > **Setup Node.js App** > Create Application, twice:

|                          | web                  | api                 |
| ------------------------ | -------------------- | ------------------- |
| Node version             | 22                   | 22                  |
| Application root         | `apps/web`           | `apps/api`          |
| Application URL          | your domain          | an `api.` subdomain |
| Application startup file | `apps/web/server.js` | `dist/src/main.js`  |

The web startup path is nested twice on purpose. The standalone build keeps its
`apps/web/` layout so the symlinks Next writes for `@shared/ui` still resolve,
so the app root is `apps/web` and the entry inside it is `apps/web/server.js`.

Do not set a port. Passenger assigns one and both apps already read `PORT`.

### 2. Set environment variables

In each app's panel, under **Environment variables**. Do not upload a `.env`;
the deploy scrubs those, and CI never has them.

The API needs everything from [.env.example](../.env.example) except the
`NEXT_PUBLIC_*` entries. The web app needs almost nothing at runtime, because
`NEXT_PUBLIC_*` values are baked in at build time.

Two that are easy to get wrong:

- `WEB_APP_URL` must exactly match your real origin. The API refuses
  cross-origin requests from anything else, see [main.ts](../apps/api/src/main.ts).
- `COOKIE_DOMAIN` must be `.yourdomain.id`, with the leading dot, so the auth
  cookie is shared between the site and the `api.` subdomain. Leave it empty and
  every login silently fails in production.

### 3. Point Git Version Control at the deploy branch

cPanel > **Git Version Control** > Create:

- Clone URL: your repo (add a read-only deploy key if it is private)
- Repository path: `~/repo`
- Branch: `deploy`

The branch only exists after the workflow has run once, so push to `main` first.

### 4. GitHub repository variables

Settings > Secrets and variables > Actions > **Variables** tab. These are
build-time and public, so they are variables, not secrets:

- `NEXT_PUBLIC_APP_URL` — `https://yourdomain.id`, no trailing slash
- `NEXT_PUBLIC_API_URL` — `https://api.yourdomain.id/api`
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` — optional

Changing one of these needs a rebuild to take effect. Restarting the app does
nothing, because the old value is already compiled into the JavaScript.

### 5. Optional: fully automatic deploys

Without this, each deploy ends with you clicking **Update from Remote** then
**Deploy HEAD Commit** in cPanel. To skip that, add these as **Secrets**:

- `CPANEL_URL` — `https://yourdomain.id:2083`
- `CPANEL_USER` — your cPanel username
- `CPANEL_API_TOKEN` — cPanel > Manage API Tokens > Create
- `CPANEL_REPO_PATH` — `/home/<user>/repo`

The workflow skips this step when `CPANEL_API_TOKEN` is absent, so adding them
later changes nothing else.

## Database

Domainesia's cPanel has native PostgreSQL, so create the database there and
point `DATABASE_URL` at `localhost`. A database on the same machine removes a
cross-datacenter round trip from every request, which is worth more than any
cache you can add on a plan this size.

Migrations still run from your laptop against the server:

```sh
pnpm db:migrate
```

That needs remote Postgres access enabled in cPanel, or an SSH tunnel.

## What this does not do

- **No rollback.** The previous release is deleted at the end of `.cpanel.yml`.
  Recovering means re-running the workflow on an older commit.
- **No zero-downtime.** Passenger restarts both apps, so expect a couple of
  seconds where requests queue.
- **Artifact size.** Roughly 86MB for web plus 132MB for api per push. Force-pushing
  a single orphan commit keeps the branch itself flat, but GitHub still stores
  the objects until it garbage-collects.

## Caching, in priority order

1. **Cloudflare free tier** in front of the domain. Every public route is
   prerendered static (confirmed in the build output), so Cloudflare can serve
   the whole marketing site without touching your host. This is the single
   biggest win available on shared hosting.
2. **Immutable headers on `/_next/static/*`.** Already correct by default.
3. **Nothing else.** The dynamic routes are `/dashboard`, `/admin` and the auth
   pages. Those are per-user, and [api.ts](../apps/web/src/lib/api.ts) sends
   `cache: "no-store"` on every request, which is deliberate. Caching them would
   serve one attendee's submissions to another.
