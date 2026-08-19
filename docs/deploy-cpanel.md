# Deploying to Domainesia cPanel

> **This page assumes the plan can run Node.js.** The **Nimbus One** plan cannot;
> Node starts at Nimbus Go. Until the plan is upgraded, the public site ships as
> plain files instead, see [deploy-static-cpanel.md](./deploy-static-cpanel.md).
> Everything below is written and tested and waiting for that upgrade.

GitHub Actions builds, cPanel only copies. That split exists because `next build`
peaks well above the 1-2GB a shared plan gives you, so building on the server
gets the process killed partway through with no useful error.

```
push to main  ->  Actions builds + type-checks  ->  force-push to `deploy` branch
                                                            |
                                              cPanel Git Version Control pulls
                                                            |
                                        .cpanel.yml copies files + restarts Passenger
```

The `deploy` branch is a build artifact, not history. It is overwritten every
run and you should never commit to it by hand.

## Scope: the public site first

The first iteration ships **only the web app**. The API is built and type-checked
on every run, but its artifact is not published and no cPanel app serves it, so
there is one Node.js app to create instead of two and the deploy branch carries
~86MB instead of ~218MB.

What that means for the deployed site:

- The public pages (`/`, `/submission`, `/call-for-papers`, `/important-dates`,
  `/speakers`, `/venue`) are prerendered static and fully working. They read
  nothing from the API.
- `/sign-in`, `/dashboard` and `/admin` are still in the build and will fail on
  their first API call. `robots.txt` already keeps them out of search results.

Turning the API on later is [one variable and one cPanel app](#turning-the-api-on),
with no code change.

## One-time server setup

### 1. Create the Node.js app

cPanel > **Setup Node.js App** > Create Application:

|                          | web                  |
| ------------------------ | -------------------- |
| Node version             | 22                   |
| Application root         | `apps/web`           |
| Application URL          | your domain          |
| Application startup file | `apps/web/server.js` |

The web startup path is nested twice on purpose. The standalone build keeps its
`apps/web/` layout so the symlinks Next writes for `@shared/ui` still resolve,
so the app root is `apps/web` and the entry inside it is `apps/web/server.js`.

Do not set a port. Passenger assigns one and the app already reads `PORT`.

### 2. Set environment variables

In the app's panel, under **Environment variables**. Do not upload a `.env`;
the deploy scrubs those, and CI never has them.

For a web-only deploy this step is almost empty: every value the public site
uses is a `NEXT_PUBLIC_*` one, and those are inlined at build time in CI, not
read at runtime. Set them in [step 4](#4-github-repository-variables) instead.

One that is easy to get wrong even so:

- `NEXT_PUBLIC_API_URL` must be present in the **CI build** (step 4), not only
  because it is inlined into the bundle but because the Content-Security-Policy
  in [next.config.ts](../apps/web/next.config.ts) names the API origin in
  `connect-src`. That header is computed at build time and baked into the build
  manifest, so a rebuild is the only way to change it. If the variable is
  missing at build time the policy falls back to allowing any https origin: the
  site still works, but the CSP is looser than intended.

When you add the API, its panel needs everything in
[.env.example](../.env.example) except the `NEXT_PUBLIC_*` entries. Three of
those are easy to get wrong:

- `WEB_APP_URL` must exactly match your real origin. The API refuses
  cross-origin requests from anything else, see [main.ts](../apps/api/src/main.ts).
- `COOKIE_DOMAIN` must be `.yourdomain.id`, with the leading dot, so the auth
  cookie is shared between the site and the `api.` subdomain. Leave it empty and
  every login silently fails in production.
- `TRUSTED_PROXY_HOPS` is how many proxies sit in front of the app: `1` for
  Passenger alone, `2` with Cloudflare in front of it. It decides which address
  the rate limiter counts against. Too low and every visitor shares one bucket,
  so one person fumbling their password rate-limits the whole conference; too
  high and a caller can spoof `X-Forwarded-For` to bypass throttling entirely.
  Count the hops, do not guess.

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

Set `NEXT_PUBLIC_API_URL` to the subdomain you intend to use even before the API
is deployed. It is what pins `connect-src` in the CSP, and getting it right now
means the site does not need a rebuild the day the API goes up.

`NEXT_PUBLIC_APP_URL` is not optional in practice. It is the canonical origin
for every `<link rel="canonical">`, the sitemap and `robots.txt`. Leave it unset
and the site deploys pointing search engines at `http://localhost:3000`.

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

## Turning the API on

When registration and submissions need to go live, in this order:

1. **Create the database.** Domainesia's cPanel has native PostgreSQL, so create
   it there and point `DATABASE_URL` at `localhost`. A database on the same
   machine removes a cross-datacenter round trip from every request, which is
   worth more than any cache you can add on a plan this size.
2. **Run the migrations** from your laptop against the server with
   `pnpm db:migrate`, then `pnpm db:seed`. Nothing in the deploy runs them, by
   design: a migration that fails halfway through a Passenger restart is worse
   than one you watched run. This needs remote Postgres access enabled in
   cPanel, or an SSH tunnel.
3. **Create the second Node.js app**, pointed at the `api.` subdomain:

   |                          | api                 |
   | ------------------------ | ------------------- |
   | Node version             | 22                  |
   | Application root         | `apps/api`          |
   | Application URL          | `api.yourdomain.id` |
   | Application startup file | `dist/src/main.js`  |

4. **Fill its environment variables** from [.env.example](../.env.example), minding
   the three called out in [step 2](#2-set-environment-variables). The API refuses
   to start when one is missing rather than booting half-configured, so a typo
   here shows up immediately in the cPanel log.
5. **Set the repository variable `DEPLOY_API` to `true`** and re-run the workflow.
   That is the only change to the pipeline; `ops/cpanel.yml` already deploys
   either shape.

Until step 5, `~/apps/api` is never written to, and after it the web app deploys
exactly as before.

## What this does not do

- **No rollback.** The previous release is deleted at the end of `.cpanel.yml`.
  Recovering means re-running the workflow on an older commit.
- **No zero-downtime.** Passenger restarts each deployed app, so expect a couple
  of seconds where requests queue.
- **No migrations.** `pnpm db:migrate` is a thing you run, deliberately, from
  your laptop. See [Turning the API on](#turning-the-api-on).
- **Artifact size.** Roughly 86MB for web, plus another 132MB once `DEPLOY_API`
  is on. Force-pushing a single orphan commit keeps the branch itself flat, but
  GitHub still stores the objects until it garbage-collects.

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
