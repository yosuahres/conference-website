# Conference site

Public site, paper submission, peer review, registration and payment for an
academic conference.

Two apps in a Turborepo, sharing one Postgres:

- **`apps/api`** — NestJS. Owns the database and every business rule.
- **`apps/web`** — Next.js. Renders the UI and calls the API.

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
  app/(public)/     landing, CFP, speakers, programme, fees, CMS pages
  app/(auth)/       sign in, verify email, forgot/reset password
  app/(dashboard)/  author and attendee area
  app/admin/        committee area
  lib/api.ts        the one place web talks to api
  lib/server-api.ts cookie forwarding + auth helpers for server components

packages/types/   the API contract, shared by both apps
packages/ui/      shared shadcn components
packages/config-* eslint, tailwind, tsconfig presets
```

### How the two apps talk

Auth is a pair of httpOnly cookies issued by the API. Cookies ignore ports, so
in development a cookie set by `localhost:3333` is sent to `localhost:3000`
automatically; in production put both behind sibling subdomains and set
`COOKIE_DOMAIN`.

- **Server components** fetch from the API and forward the incoming cookie
  header by hand — Node's `fetch` has no browser cookie jar. See
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

## Getting started

Requires Node 22+, pnpm 10 and a Postgres database.

```bash
pnpm install
cp .env.example .env          # fill in the values
cp .env apps/web/.env         # Next reads its own copy
pnpm db:migrate               # apply migrations
pnpm db:seed                  # demo conference with tracks, tiers, schedule
pnpm dev                      # api on :3333, web on :3000
```

Sign up through the UI, then grant yourself the committee role:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

Seeded dates are relative to the day you run `db:seed`, so submissions are
always open and the conference is always a few months out.

External accounts you need: **Resend** (verify your sending domain),
**Midtrans** (sandbox keys; set the Payment Notification URL to
`{NEXT_PUBLIC_API_URL}/payments/webhook/midtrans`), and an **S3-compatible
bucket** — keep it private, the API signs every read and write.

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

Authors edit only in `draft` and `revision_requested`. Uploads are versioned —
a re-upload never overwrites a file a reviewer already read. The reference
(`ICRST-0001`) derives from the row id, so it is unique without a counter table.

Reviewers can open only the papers assigned to them; admins see everything.

### Registration and payment

Tiers are date-gated: the ones on offer are those whose window contains "now"
and whose quota is not exhausted. The price is **snapshot onto the
registration** at creation, so editing a tier later never rewrites an issued
invoice.

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

Both live inside the API process — a long-running Nest app schedules its own
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
| `pnpm db:generate` | Generate a migration from schema changes |
| `pnpm db:migrate`  | Apply migrations                         |
| `pnpm db:studio`   | Drizzle Studio                           |
| `pnpm db:seed`     | Seed the demo conference                 |

## Notes and trade-offs

- **`apps/api` does not extend the shared tsconfig.** That preset is
  NodeNext/ESM; Nest's dependency injection needs `emitDecoratorMetadata` under
  CommonJS.
- **Public pages render dynamically.** Their content lives in the database so
  the committee can edit it, and caching would make edits invisible.
- **The JWT strategy re-reads the user on every request** instead of trusting
  the token body, so granting or revoking a role takes effect immediately
  rather than lingering until the access token expires.
- **Markdown page bodies are rendered without sanitising.** They are authored by
  admins only. Sanitise in `apps/web/src/lib/markdown.ts` if that ever changes.
- **Amounts are whole rupiah integers.** IDR has no minor units and Midtrans
  rejects a fractional `gross_amount`.

## Not built yet

- Admin CRUD for pages, speakers, schedule, tracks and tiers — the schema and
  the public rendering are done, but the committee still edits these via SQL or
  the seed. This is the biggest remaining gap.
- The reviewer's own review-submission screen. `POST /submissions/:id/review`
  and `POST /submissions/:id/reviewers` both work; nothing in the UI calls them.
- PDF invoices and certificates.
- Bahasa Indonesia translations.
