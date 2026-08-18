import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import { users } from './users';
import { conferences } from './conference';
import { submissions } from './submissions';

export const attendeeCategoryEnum = pgEnum('attendee_category', [
  'presenter',
  'participant',
  'student_presenter',
  'student_participant',
]);

export const attendanceModeEnum = pgEnum('attendance_mode', [
  'onsite',
  'online',
]);

export const registrationStatusEnum = pgEnum('registration_status', [
  'pending_payment',
  'paid',
  'cancelled',
  'refunded',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'paid',
  'failed',
  'expired',
  'cancelled',
  'refunded',
]);

export const registrationTiers = pgTable(
  'registration_tiers',
  {
    id: serial('id').primaryKey(),
    conferenceId: integer('conference_id')
      .notNull()
      .references(() => conferences.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    category: attendeeCategoryEnum('category').notNull(),
    mode: attendanceModeEnum('mode').notNull().default('onsite'),
    price: integer('price').notNull(),
    currency: text('currency').notNull().default('IDR'),
    description: text('description'),

    validFrom: timestamp('valid_from'),
    validUntil: timestamp('valid_until'),
    quota: integer('quota'),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [
    index('registration_tiers_conference_idx').on(table.conferenceId),
  ],
);

export const registrations = pgTable(
  'registrations',
  {
    id: serial('id').primaryKey(),
    conferenceId: integer('conference_id')
      .notNull()
      .references(() => conferences.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    tierId: integer('tier_id')
      .notNull()
      .references(() => registrationTiers.id, { onDelete: 'restrict' }),
    submissionId: integer('submission_id').references(() => submissions.id, {
      onDelete: 'set null',
    }),

    invoiceNumber: text('invoice_number').notNull(),
    status: registrationStatusEnum('status')
      .notNull()
      .default('pending_payment'),
    mode: attendanceModeEnum('mode').notNull().default('onsite'),

    amount: integer('amount').notNull(),
    currency: text('currency').notNull().default('IDR'),

    fullName: text('full_name').notNull(),
    affiliation: text('affiliation'),
    country: text('country'),
    phone: text('phone'),
    dietaryNotes: text('dietary_notes'),
    needsVisaLetter: boolean('needs_visa_letter').notNull().default(false),

    paidAt: timestamp('paid_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('registrations_invoice_idx').on(table.invoiceNumber),
    index('registrations_user_idx').on(table.userId),
    index('registrations_status_idx').on(table.conferenceId, table.status),
  ],
);

export const payments = pgTable(
  'payments',
  {
    id: serial('id').primaryKey(),
    registrationId: integer('registration_id')
      .notNull()
      .references(() => registrations.id, { onDelete: 'cascade' }),

    provider: text('provider').notNull().default('midtrans'),
    providerOrderId: text('provider_order_id').notNull(),
    providerTransactionId: text('provider_transaction_id'),
    method: text('method'),

    amount: integer('amount').notNull(),
    currency: text('currency').notNull().default('IDR'),
    status: paymentStatusEnum('status').notNull().default('pending'),

    rawPayload: jsonb('raw_payload'),

    expiresAt: timestamp('expires_at'),
    paidAt: timestamp('paid_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('payments_provider_order_idx').on(table.providerOrderId),
    index('payments_registration_idx').on(table.registrationId),
  ],
);

export const registrationTiersRelations = relations(
  registrationTiers,
  ({ one, many }) => ({
    conference: one(conferences, {
      fields: [registrationTiers.conferenceId],
      references: [conferences.id],
    }),
    registrations: many(registrations),
  }),
);

export const registrationsRelations = relations(
  registrations,
  ({ one, many }) => ({
    conference: one(conferences, {
      fields: [registrations.conferenceId],
      references: [conferences.id],
    }),
    user: one(users, {
      fields: [registrations.userId],
      references: [users.id],
    }),
    tier: one(registrationTiers, {
      fields: [registrations.tierId],
      references: [registrationTiers.id],
    }),
    submission: one(submissions, {
      fields: [registrations.submissionId],
      references: [submissions.id],
    }),
    payments: many(payments),
  }),
);

export const paymentsRelations = relations(payments, ({ one }) => ({
  registration: one(registrations, {
    fields: [payments.registrationId],
    references: [registrations.id],
  }),
}));

export type RegistrationTier = typeof registrationTiers.$inferSelect;
export type Registration = typeof registrations.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];
