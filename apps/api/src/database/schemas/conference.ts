import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const conferences = pgTable(
  'conferences',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    shortName: text('short_name'),
    edition: text('edition'),
    tagline: text('tagline'),
    description: text('description'),

    startsOn: date('starts_on'),
    endsOn: date('ends_on'),
    venueName: text('venue_name'),
    venueAddress: text('venue_address'),
    city: text('city'),
    country: text('country'),
    timezone: text('timezone').notNull().default('Asia/Jakarta'),

    submissionOpensAt: timestamp('submission_opens_at'),
    submissionDeadline: timestamp('submission_deadline'),
    notificationDate: timestamp('notification_date'),
    cameraReadyDeadline: timestamp('camera_ready_deadline'),
    registrationDeadline: timestamp('registration_deadline'),

    contactEmail: text('contact_email'),
    websiteUrl: text('website_url'),
    bannerImageKey: text('banner_image_key'),

    isActive: boolean('is_active').notNull().default(false),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('conferences_active_idx').on(table.isActive)],
);

export const pages = pgTable(
  'pages',
  {
    id: serial('id').primaryKey(),
    conferenceId: integer('conference_id')
      .notNull()
      .references(() => conferences.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull().default(''),
    navLabel: text('nav_label'),
    showInNav: boolean('show_in_nav').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(false),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('pages_conference_slug_idx').on(table.conferenceId, table.slug),
  ],
);

export const tracks = pgTable(
  'tracks',
  {
    id: serial('id').primaryKey(),
    conferenceId: integer('conference_id')
      .notNull()
      .references(() => conferences.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [index('tracks_conference_idx').on(table.conferenceId)],
);

export const speakers = pgTable(
  'speakers',
  {
    id: serial('id').primaryKey(),
    conferenceId: integer('conference_id')
      .notNull()
      .references(() => conferences.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    title: text('title'),
    affiliation: text('affiliation'),
    country: text('country'),
    bio: text('bio'),
    photoKey: text('photo_key'),
    isKeynote: boolean('is_keynote').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [index('speakers_conference_idx').on(table.conferenceId)],
);

export const scheduleItems = pgTable(
  'schedule_items',
  {
    id: serial('id').primaryKey(),
    conferenceId: integer('conference_id')
      .notNull()
      .references(() => conferences.id, { onDelete: 'cascade' }),
    day: date('day').notNull(),
    startsAt: timestamp('starts_at').notNull(),
    endsAt: timestamp('ends_at'),
    title: text('title').notNull(),
    description: text('description'),
    room: text('room'),
    speakerId: integer('speaker_id').references(() => speakers.id, {
      onDelete: 'set null',
    }),
  },
  (table) => [
    index('schedule_conference_day_idx').on(table.conferenceId, table.day),
  ],
);

export const conferencesRelations = relations(conferences, ({ many }) => ({
  pages: many(pages),
  tracks: many(tracks),
  speakers: many(speakers),
  scheduleItems: many(scheduleItems),
}));

export const pagesRelations = relations(pages, ({ one }) => ({
  conference: one(conferences, {
    fields: [pages.conferenceId],
    references: [conferences.id],
  }),
}));

export const tracksRelations = relations(tracks, ({ one }) => ({
  conference: one(conferences, {
    fields: [tracks.conferenceId],
    references: [conferences.id],
  }),
}));

export const speakersRelations = relations(speakers, ({ one, many }) => ({
  conference: one(conferences, {
    fields: [speakers.conferenceId],
    references: [conferences.id],
  }),
  scheduleItems: many(scheduleItems),
}));

export const scheduleItemsRelations = relations(scheduleItems, ({ one }) => ({
  conference: one(conferences, {
    fields: [scheduleItems.conferenceId],
    references: [conferences.id],
  }),
  speaker: one(speakers, {
    fields: [scheduleItems.speakerId],
    references: [speakers.id],
  }),
}));

export type Conference = typeof conferences.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type Track = typeof tracks.$inferSelect;
export type Speaker = typeof speakers.$inferSelect;
export type ScheduleItem = typeof scheduleItems.$inferSelect;
