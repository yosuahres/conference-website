import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', [
  'attendee',
  'reviewer',
  'admin',
]);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password'),
  refreshToken: text('refresh_token'),

  name: text('name').notNull(),
  role: userRoleEnum('role').notNull().default('attendee'),
  title: text('title'),
  affiliation: text('affiliation'),
  country: text('country'),
  phone: text('phone'),

  emailVerified: boolean('email_verified').notNull().default(false),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const verificationTokenPurposeEnum = pgEnum('verification_purpose', [
  'email_verification',
  'password_reset',
]);

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    purpose: verificationTokenPurposeEnum('purpose').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    consumedAt: timestamp('consumed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('verification_tokens_hash_idx').on(table.tokenHash)],
);

export const usersRelations = relations(users, ({ many }) => ({
  verificationTokens: many(verificationTokens),
}));

export const verificationTokensRelations = relations(
  verificationTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [verificationTokens.userId],
      references: [users.id],
    }),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserRole = (typeof userRoleEnum.enumValues)[number];

export type PublicUser = Omit<User, 'password' | 'refreshToken'>;

export function toPublicUser(user: User): PublicUser {
  const { password: _password, refreshToken: _refreshToken, ...rest } = user;
  return rest;
}
