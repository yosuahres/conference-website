import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const emailStatusEnum = pgEnum('email_status', [
  'queued',
  'sent',
  'failed',
]);

/**
 * Every outbound email is logged before it is sent. This is the retry queue as
 * well as the audit trail — a cron route picks up `queued`/`failed` rows with
 * `attempts < 3` and retries them, which is all the durability a conference
 * needs (no Redis, no BullMQ).
 */
export const emailLog = pgTable(
  'email_log',
  {
    id: serial('id').primaryKey(),
    toEmail: text('to_email').notNull(),
    subject: text('subject').notNull(),
    /** Template key, e.g. "submission-received". Matches a file in email/templates. */
    template: text('template').notNull(),
    /** Props the template was rendered with, so a retry is reproducible. */
    payload: jsonb('payload'),

    // Loose polymorphic link — "submission" / "registration" / "payment".
    relatedType: text('related_type'),
    relatedId: integer('related_id'),

    status: emailStatusEnum('status').notNull().default('queued'),
    attempts: integer('attempts').notNull().default(0),
    providerMessageId: text('provider_message_id'),
    error: text('error'),

    sentAt: timestamp('sent_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('email_log_status_idx').on(table.status),
    index('email_log_related_idx').on(table.relatedType, table.relatedId),
  ],
);

export type EmailLogEntry = typeof emailLog.$inferSelect;
