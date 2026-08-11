# Conference site

Public site, paper submission, peer review, registration and payment for an
academic conference. One Next.js app, one Postgres database.

## Architecture

```
apps/web/                      the entire application
  src/app/
    (public)/                  landing, CFP, speakers, programme, fees, CMS pages
    (auth)/                    sign in / sign up
    (dashboard)/               author + attendee area
    admin/                     committee: submissions, decisions, registrations, roles
    api/
      auth/[...all]/           Better Auth handler
      webhooks/midtrans/       payment notifications
      cron/                    email retries + payment reconciliation
      admin/registrations.csv  attendee export
  src/server/
    db/                        Drizzle schema, client, seed
    auth/                      Better Auth config + session helpers
    conference/                active-edition queries, deadline helpers
    submissions/               queries, state machine, server actions
    registrations/             queries, server actions
    payment/                   Midtrans client + payment service
    email/                     Resend sender, retry queue, React Email templates
    storage/                   presigned S3 uploads/downloads

packages/ui/                   shared shadcn components
packages/config-*/             eslint, tailwind, tsconfig presets
```

There is no API gateway, no message broker and no Redis. Server Actions and
Route Handlers are the backend; the only background job is a single cron route.

### Stack

| Concern   | Choice                                             |
| --------- | -------------------------------------------------- |
| Framework | Next.js 15 (App Router), React 19, TypeScript      |
| Database  | PostgreSQL + Drizzle ORM                           |
| Auth      | Better Auth (email + password, email verification) |
| Email     | Resend + React Email                               |
| Payments  | Midtrans Snap (QRIS, VA, e-wallet, card)           |
| Files     | Any S3-compatible bucket, presigned direct upload  |
| Styling   | Tailwind + shadcn/ui                               |

## Getting started

Requires Node 22+, pnpm 10 and a Postgres database.

```bash
pnpm install
cp .env.example .env          # fill in the values, see below
cp .env .env.local            # apps/web reads its own .env too
pnpm db:migrate               # apply migrations
pnpm db:seed                  # demo conference with tracks, tiers, schedule
pnpm dev                      # http://localhost:3000
```

Sign up through the UI, then grant yourself the committee role:

```sql
UPDATE "user" SET role = 'admin' WHERE email = 'you@example.com';
```

Seeded dates are relative to the day you run `db:seed`, so submissions are
always open and the conference is always a few months out.

### Environment

Every variable is validated at boot in [env.ts](apps/web/src/server/env.ts) —
a missing one fails loudly rather than at 2am. See
[.env.example](.env.example) for the annotated list.

External services you need accounts for:

- **Resend** — verify your sending domain, then set `RESEND_API_KEY` and `EMAIL_FROM`.
- **Midtrans** — sandbox keys from the dashboard. Set the Payment Notification
  URL to `{NEXT_PUBLIC_APP_URL}/api/webhooks/midtrans`.
- **S3-compatible bucket** — AWS S3, Cloudflare R2, Supabase Storage or MinIO.
  Keep the bucket private; the app signs every read and write.

## How the domain works

### Submissions

Papers move through an explicit state machine
([state.ts](apps/web/src/server/submissions/state.ts)):

```
draft ─┬─> submitted ─┬─> under_review ─┬─> accepted ──> camera_ready_submitted
       │              │                 ├─> revision_requested ──> submitted
       │              │                 └─> rejected
       └─> withdrawn  └─> …
```

Authors can edit only in `draft` and `revision_requested`. Uploads are
versioned — a re-upload never overwrites the file a reviewer already read.
The reference (`ICRST-0001`) is derived from the row id, so it is unique
without a counter table.

### Registration and payment

Tiers are date-gated: the ones on offer are those whose `validFrom`/`validUntil`
window contains "now" and whose quota is not exhausted. The price is **snapshot
onto the registration** at creation, so editing a tier later never rewrites an
issued invoice.

Payment is the only part with an external moving piece:

1. `createRegistration` reserves the place (`pending_payment`) and opens a
   Midtrans Snap transaction, then emails payment instructions.
2. The attendee pays on Midtrans' hosted page.
3. Midtrans POSTs to `/api/webhooks/midtrans`. The SHA-512 signature is verified
   before anything else; a bad signature is dropped with a 200 so Midtrans does
   not retry it for 24 hours.
4. `applyNotification` is idempotent and never walks a settled payment
   backwards, so replayed or out-of-order callbacks are safe.
5. On `paid`, the registration flips and a receipt is emailed.

Each retry gets a fresh `order_id` (`INV-…-1`, `INV-…-2`) because Midtrans never
allows one to be reused.

### Email

Every send is written to `email_log` **before** it goes out, together with the
template key and its props. If the send fails, the row stays `failed` and the
cron route re-renders it from the stored props and tries again, up to three
times. That is the entire durability story — no queue, no Redis.

### The cron route

Point any scheduler at `GET /api/cron` every ~15 minutes:

```
*/15 * * * * curl -H "Authorization: Bearer $CRON_SECRET" https://your-site/api/cron
```

It retries failed emails and reconciles payments whose webhook never arrived
(it asks Midtrans directly what happened to each `pending` order). Set
`CRON_SECRET` to require the header; leave it empty and the route is open.

## Commands

| Command            | What it does                               |
| ------------------ | ------------------------------------------ |
| `pnpm dev`         | Dev server on :3000                        |
| `pnpm build`       | Production build                           |
| `pnpm type-check`  | `tsc --noEmit` across the workspace        |
| `pnpm lint`        | ESLint                                     |
| `pnpm db:generate` | Generate a migration from schema changes   |
| `pnpm db:migrate`  | Apply migrations                           |
| `pnpm db:push`     | Push schema without a migration (dev only) |
| `pnpm db:studio`   | Drizzle Studio                             |
| `pnpm db:seed`     | Seed the demo conference                   |

Preview email templates in a browser with
`pnpm --filter web email:dev` (http://localhost:3030).

## Notes and trade-offs

- **Public pages render dynamically.** Their content lives in the database so
  the committee can edit it, and caching would make edits invisible. If traffic
  ever justifies it, switch to `revalidate` plus `revalidatePath` on admin saves.
- **Session cookie caching is off** on purpose. It would embed `role` in the
  cookie, so revoking admin would not take effect for another five minutes.
- **Markdown page bodies are rendered without sanitising.** They are authored by
  admins only. Sanitise in [markdown.ts](apps/web/src/lib/markdown.ts) if page
  editing is ever opened up further.
- **Amounts are whole rupiah integers.** IDR has no minor units and Midtrans
  rejects fractional `gross_amount`.

## Not built yet

Deliberately out of scope for this pass:

- Admin CRUD for pages, speakers, schedule, tracks and tiers — the schema and
  the public rendering are done, but the committee still edits these via SQL or
  the seed. This is the biggest remaining gap.
- Reviewer assignment UI (`assignReviewer` exists as an action; nothing calls it)
  and the reviewer's own review-submission screen.
- PDF invoices and certificates.
- Bulk decision import/export for the programme committee.
- Bahasa Indonesia translations.
