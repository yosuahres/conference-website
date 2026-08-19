# Deploying the public site to cPanel without Node

The DomaiNesia **Nimbus One** plan has no Node.js runtime, so the NestJS API and
the Next.js server cannot run on it. Apache can still serve files, which is what
the previous developer's site was, so the public site ships as files too.

This is a build mode, not a fork of the codebase. One environment variable picks
between the two shapes, and the day the host can run Node you switch back and
get the dashboard and admin with it. See [deploy-cpanel.md](./deploy-cpanel.md)
for that path.

## What ships and what does not

|                                             | Static export        | Needs Node |
| ------------------------------------------- | -------------------- | ---------- |
| `/`, `/submission`, `/call-for-papers`      | yes                  |            |
| `/important-dates`, `/speakers`, `/venue`   | yes                  |            |
| Sitemap, robots, canonicals, social cards   | yes                  |            |
| Security headers                            | yes, via `.htaccess` |            |
| `/sign-in`, `/dashboard`, `/admin`          |                      | yes        |
| Attendee registration, payment, file upload |                      | yes        |

The public pages prerender to static HTML in both modes, so the design, the
animations, the venue map and the template downloads are byte-for-byte what you
get from the server build. Nothing is rewritten and nothing is deleted.

Paper submission still works: `content/site.ts` offers two methods, the
dashboard and the seminar email box, and the static build drops the first and
renumbers so the email route reads as method 1. Authors are not shown a link to
a page that is not there.

## Building

```sh
pnpm --filter web build:static
```

Produces `apps/web/dist-static.zip`, roughly 12MB and 99 files. Both are
gitignored.

The script builds from your **last commit** in a throwaway git worktree, never
from your working directory. `output: "export"` refuses to build a route that
needs a server, so `(auth)`, `(dashboard)` and `admin` have to be absent rather
than merely unreachable, and doing that to your checkout would be destructive.
Uncommitted changes are not included, and the script says so when it finds any.

## Uploading

1. cPanel > **File Manager** > `public_html`
2. **Upload** `dist-static.zip`
3. Select it > **Extract** > into `public_html`
4. Delete the zip
5. Rename the old `index.html` to `index.html.bak` and `assets` to `assets.bak`
   **after** confirming the new home page loads. They are your rollback.

Make sure File Manager is showing dotfiles (**Settings** > Show Hidden Files) or
you will not see the `.htaccess` the zip carries, and without it every URL
except the home page 404s.

## The .htaccess

[ops/htaccess](../ops/htaccess) is copied into the zip as `.htaccess`. It does
three jobs:

- **Routing.** The export writes `/submission.html`, not `/submission/index.html`,
  so Apache is told to serve the former when the latter is requested. Without
  this only `/` works.
- **Security headers.** The static build has no server to set them, so Apache
  does. This list mirrors `securityHeaders` in
  [next.config.ts](../apps/web/next.config.ts); change one and change the other.
- **Caching.** Hashed bundles are immutable for a year, HTML must revalidate so
  a redeploy is not invisible to anyone who has already visited.

## Redeploying

Rebuild, re-upload, re-extract, overwrite when prompted. There is no push-button
deploy here because there is no Node on the host to run one.

If that gets tedious, the workflow can FTP `dist-static/` straight into
`public_html` on every push to `main`. It needs the cPanel FTP host, user and
password as GitHub secrets. Worth doing once the content stops changing daily.

## Known gaps

- **No rollback beyond the `.bak` copies.** Keep them until you are confident.
- **`sitemap.xml` carries the build timestamp** as `lastmod` on every URL, so
  every rebuild tells search engines every page changed. Harmless at this
  cadence, wrong if the site is rebuilt daily.
- **`NEXT_PUBLIC_APP_URL` is not read by this build**; the canonical origin
  falls back to `event.website` in `content/site.ts`, which is already
  `https://isphoa2026.org`. Change it there, not in an env var.
