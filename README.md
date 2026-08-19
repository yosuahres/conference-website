# ISPhOA 2026

Public site, paper submission, peer review, registration and payment for the
**International Seminar on Photonics, Optics, and its Applications**, held
2–3 December 2026 at UIN Mahmud Yunus Batusangkar, West Sumatra.

Two apps in a Turborepo, sharing one Postgres:

- **`apps/api`** (NestJS) owns the database and every business rule.
- **`apps/web`** (Next.js) renders the UI and calls the API.

The backend is a **monolith**: one Nest process, one database, no gateway, no
message broker, no Redis. Background work runs as two `@Cron` jobs inside that
process.

## Layout

```
apps/api/src/
  database/       Drizzle schema (15 tables), connection, seed
  auth/           JWT + refresh cookies, email verification, password reset, OAuth
  users/          profile and role management
  conference/     active edition, tracks, speakers, schedule, CMS pages
  submissions/    state machine, uploads, reviews, decisions
  registrations/  date-gated tiers, invoicing, CSV export
  payments/       Midtrans Snap, webhook, reconciliation sweep
  email/          Resend, React Email templates, retry sweep
  storage/        presigned S3 upload and download
  common/         roles guard, formatting

apps/web/src/
  content/site.ts   every word and date on the public site, in one file
  components/site/  the public site's own sections and primitives
  app/(public)/     landing, venue, important dates, speakers, call for papers
  app/(auth)/       sign in, verify email, forgot/reset password
  app/(dashboard)/  author and attendee area
  app/admin/        committee area
  app/sitemap.ts    sitemap, robots.ts, opengraph-image.tsx alongside it
  lib/api.ts        the one place web talks to api
  lib/seo.ts        canonical URL, titles, per-page metadata
  lib/server-api.ts cookie forwarding + auth helpers for server components

packages/types/   the API contract, shared by both apps
packages/ui/      shared shadcn components
packages/config-* eslint, tailwind, tsconfig presets

.github/workflows/deploy.yml  builds and publishes the `deploy` branch
ops/cpanel.yml                what cPanel runs on that branch
docs/deploy-cpanel.md         the one-time server setup
```

### The public site is static, the app behind it is not

The five public pages read from [`content/site.ts`](apps/web/src/content/site.ts),
a plain TypeScript module, and touch neither the API nor the database. They
prerender at build time, which is what makes the marketing site cacheable by
Cloudflare on a shared host.

Everything behind sign-in is the opposite: `/dashboard` and `/admin` are
per-user, fetched live, and [`api.ts`](apps/web/src/lib/api.ts) sends
`cache: "no-store"` on every request.

The database still carries a `pages`/`speakers`/`schedule` CMS, the seed still
fills it, and `GET /conference/nav` and `GET /conference/pages/:slug` still
serve it. Nothing in the current public site calls them. The committee wanted
the content designed rather than typed into a form, so it moved into the repo.
Of the API's conference endpoints, the web app now uses only `/conference`
(the active edition) and `/conference/tracks` (the submission form's dropdown).

### How the two apps talk

Auth is a pair of httpOnly cookies issued by the API. Cookies ignore ports, so
in development a cookie set by `localhost:3333` is sent to `localhost:3000`
automatically; in production put both behind sibling subdomains and set
`COOKIE_DOMAIN`.

- **Server components** fetch from the API and forward the incoming cookie
  header by hand, because Node's `fetch` has no browser cookie jar. See
  `forwardedCookies()`.
- **Mutations** go from the browser straight to the API with
  `credentials: "include"`.

`packages/types` keeps both ends honest. The types are hand-written rather than
inferred from Drizzle, because the API serialises dates to ISO strings and adds
computed fields (`submissionOpen`, `priceFormatted`) that exist nowhere in the
database.

### Stack

| Concern  | Choice                                                 |
| -------- | ------------------------------------------------------ |
| Backend  | NestJS 11, Drizzle ORM, PostgreSQL                     |
| Frontend | Next.js 15 (App Router), React 19, TypeScript          |
| Auth     | Passport JWT + refresh cookies, optional Google/GitHub |
| Email    | Resend + React Email                                   |
| Payments | Midtrans Snap (QRIS, VA, e-wallet, card)               |
| Files    | Any S3-compatible bucket, presigned direct upload      |
| Styling  | Tailwind + shadcn/ui                                   |
| Hosting  | GitHub Actions builds, Domainesia cPanel serves        |

## Getting started

Requires Node 22+, pnpm 10 and a Postgres database.

```bash
pnpm install
cp .env.example .env          # fill in the values
cp .env apps/web/.env         # Next reads its own copy
pnpm db:migrate               # apply migrations
pnpm db:seed                  # ISPhOA 2026: tracks, speakers, fee tiers, pages
pnpm dev                      # api on :3333, web on :3000
```

Sign up through the UI, then grant yourself the committee role:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

The seed uses the real 2026 dates, so whether submissions are open depends on
the day you run it, not on the seed.

External accounts you need: **Resend** (verify your sending domain),
**Midtrans** (sandbox keys; set the Payment Notification URL to
`{NEXT_PUBLIC_API_URL}/payments/webhook/midtrans`), and an **S3-compatible
bucket**. Keep the bucket private, the API signs every read and write.

Social login is optional. Leave the Google/GitHub variables unset and the API
simply omits those strategies.

## How the domain works

### Submissions

```
draft ─┬─> submitted ─┬─> under_review ─┬─> accepted ──> camera_ready_submitted
       │              │                 ├─> revision_requested ──> submitted
       │              │                 └─> rejected
       └─> withdrawn  └─> …
```

Authors edit only in `draft` and `revision_requested`. Uploads are versioned, so
a re-upload never overwrites a file a reviewer already read. The reference
(`ISPHOA-0001`) derives from the conference slug and the row id, so it is unique
without a counter table.

Reviewers can open only the papers assigned to them; admins see everything.

### Registration and payment

Tiers are date-gated: the ones on offer are those whose window contains "now"
and whose quota is not exhausted. The price is **snapshot onto the
registration** at creation, so editing a tier later never rewrites an issued
invoice.

Each tier carries its own currency. The seeded fee table prices international
and online tiers in USD and national tiers in IDR, and every amount is formatted
in the currency stored beside it.

1. `POST /registrations` reserves the place (`pending_payment`) and opens a
   Midtrans Snap transaction, then emails payment instructions. If the provider
   refuses, the reservation is rolled back rather than left blocking the person.
2. The attendee pays on Midtrans' hosted page.
3. Midtrans POSTs to `/api/payments/webhook/midtrans`. The SHA-512 signature is
   verified before anything else; a bad signature is dropped with a 200 so
   Midtrans does not retry it for 24 hours.
4. Applying a notification is idempotent and never walks a settled payment
   backwards, so replayed or out-of-order callbacks are safe.
5. On `paid`, the registration flips and a receipt is emailed.

Each retry gets a fresh `order_id` (`INV-…-1`, `INV-…-2`) because Midtrans
never allows one to be reused.

### Email

Every send is written to `email_log` **before** it goes out, with the template
key and its props. A failed send stays `failed`, and the retry sweep re-renders
it from the stored props and tries again, up to three times. No queue, no Redis.

### Background jobs

Both live inside the API process. A long-running Nest app schedules its own
work, so there is no cron route to point a scheduler at.

| Job               | Interval | What it does                                 |
| ----------------- | -------- | -------------------------------------------- |
| Email retry       | 10 min   | Re-sends failed emails                       |
| Payment reconcile | 30 min   | Asks Midtrans about payments still `pending` |

The reconcile sweep is what saves a registration whose webhook was dropped.

## Commands

| Command            | What it does                             |
| ------------------ | ---------------------------------------- |
| `pnpm dev`         | Both apps: api :3333, web :3000          |
| `pnpm build`       | Production build of both                 |
| `pnpm type-check`  | `tsc --noEmit` across the workspace      |
| `pnpm lint`        | ESLint                                   |
| `pnpm format`      | Prettier over the repo                   |
| `pnpm db:generate` | Generate a migration from schema changes |
| `pnpm db:migrate`  | Apply migrations                         |
| `pnpm db:studio`   | Drizzle Studio                           |
| `pnpm db:seed`     | Seed ISPhOA 2026                         |

## Deployment

Pushing to `main` runs [deploy.yml](.github/workflows/deploy.yml), which
type-checks, builds both apps, and force-pushes the artifact to a `deploy`
branch. cPanel's Git Version Control pulls that branch and
[ops/cpanel.yml](ops/cpanel.yml) copies the files into place and restarts
Passenger. Nothing is built on the server, because `next build` wants more RAM
than a shared plan has.

The web artifact is Next's `output: "standalone"` tree, which keeps its
`apps/web/` nesting so the workspace symlinks still resolve. The full one-time
server setup, including which environment variables go where, is in
[docs/deploy-cpanel.md](docs/deploy-cpanel.md).

`NEXT_PUBLIC_*` values are inlined at build time. Changing one in cPanel and
restarting does nothing; it needs a rebuild.

## Notes and trade-offs

- **`apps/api` does not extend the shared tsconfig.** That preset is
  NodeNext/ESM; Nest's dependency injection needs `emitDecoratorMetadata` under
  CommonJS.
- **Public content lives in the repo, not the database.** Editing a date or a
  speaker is a commit and a deploy, which is the price of a designed page and a
  fully static site.
- **The JWT strategy re-reads the user on every request** instead of trusting
  the token body, so granting or revoking a role takes effect immediately
  rather than lingering until the access token expires.
- **Markdown page bodies are rendered without sanitising.** They are authored by
  admins only. Sanitise in `apps/web/src/lib/markdown.ts` if that ever changes.
- **Amounts are whole integers.** IDR has no minor units and Midtrans rejects a
  fractional `gross_amount`; USD tiers are stored the same way.
- **`CONFERENCE_NAME` and `EMAIL_FROM` only reach email subjects and headers.**
  Nothing on the public site reads them; that copy lives in `content/site.ts`.

## Not built yet

- Admin CRUD for tracks, speakers, schedule and fee tiers. The schema is done
  and the public site no longer depends on it, but the committee still edits
  these via SQL or the seed.
- The reviewer's own review-submission screen. `POST /submissions/:id/review`
  and `POST /submissions/:id/reviewers` both work; nothing in the UI calls them.
- A public fee and programme page. The copy is already written in
  `content/site.ts` (`fees`, `programme`, `paymentNote`, `registrationNote`,
  `gallery`) and nothing renders it yet; attendees see prices only after signing
  in, on `/dashboard/register`.
- PDF invoices and certificates.
- Bahasa Indonesia translations.
