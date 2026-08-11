import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import { users } from './users';
import { conferences, tracks } from './conference';

export const submissionTypeEnum = pgEnum('submission_type', [
  'abstract',
  'full_paper',
  'poster',
]);

/**
 * The paper lifecycle. `withdrawn` is terminal and author-initiated; everything
 * else is driven by the committee. Transitions are enforced in
 * `src/server/submissions/state.ts`, not by the database.
 */
export const submissionStatusEnum = pgEnum('submission_status', [
  'draft',
  'submitted',
  'under_review',
  'revision_requested',
  'accepted',
  'rejected',
  'camera_ready_submitted',
  'withdrawn',
]);

export const submissionFileKindEnum = pgEnum('submission_file_kind', [
  'manuscript',
  'camera_ready',
  'supplementary',
  'copyright_form',
]);

export const reviewRecommendationEnum = pgEnum('review_recommendation', [
  'accept',
  'minor_revision',
  'major_revision',
  'reject',
]);

export const submissions = pgTable(
  'submissions',
  {
    id: serial('id').primaryKey(),
    conferenceId: integer('conference_id')
      .notNull()
      .references(() => conferences.id, { onDelete: 'cascade' }),
    /** The account that owns the submission and receives all notifications. */
    submitterId: integer('submitter_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    trackId: integer('track_id').references(() => tracks.id, {
      onDelete: 'set null',
    }),

    /** Human-facing id shown to authors and printed on the programme. */
    reference: text('reference').notNull(),

    title: text('title').notNull(),
    abstract: text('abstract').notNull(),
    keywords: text('keywords').array().notNull().default([]),
    type: submissionTypeEnum('type').notNull().default('full_paper'),
    status: submissionStatusEnum('status').notNull().default('draft'),

    /** Set once, when the author first leaves `draft`. */
    submittedAt: timestamp('submitted_at'),
    /** Set when the committee records accept/reject. */
    decidedAt: timestamp('decided_at'),
    decisionNote: text('decision_note'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('submissions_reference_idx').on(
      table.conferenceId,
      table.reference,
    ),
    index('submissions_submitter_idx').on(table.submitterId),
    index('submissions_status_idx').on(table.conferenceId, table.status),
  ],
);

/**
 * Co-authors are plain rows, not accounts — most co-authors never log in.
 * `userId` is filled opportunistically when the email matches an account.
 */
export const submissionAuthors = pgTable(
  'submission_authors',
  {
    id: serial('id').primaryKey(),
    submissionId: integer('submission_id')
      .notNull()
      .references(() => submissions.id, { onDelete: 'cascade' }),
    userId: integer('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    affiliation: text('affiliation'),
    country: text('country'),
    isCorresponding: integer('is_corresponding').notNull().default(0),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [
    index('submission_authors_submission_idx').on(table.submissionId),
  ],
);

/**
 * Files live in object storage; only the key is kept here. Uploads are never
 * overwritten — a new upload of the same kind bumps `version`, so the review
 * history stays intact.
 */
export const submissionFiles = pgTable(
  'submission_files',
  {
    id: serial('id').primaryKey(),
    submissionId: integer('submission_id')
      .notNull()
      .references(() => submissions.id, { onDelete: 'cascade' }),
    kind: submissionFileKindEnum('kind').notNull().default('manuscript'),
    storageKey: text('storage_key').notNull(),
    fileName: text('file_name').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    version: integer('version').notNull().default(1),
    uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
  },
  (table) => [
    index('submission_files_submission_idx').on(table.submissionId, table.kind),
  ],
);

export const reviews = pgTable(
  'reviews',
  {
    id: serial('id').primaryKey(),
    submissionId: integer('submission_id')
      .notNull()
      .references(() => submissions.id, { onDelete: 'cascade' }),
    reviewerId: integer('reviewer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** 1–5. Null until the reviewer submits. */
    score: integer('score'),
    recommendation: reviewRecommendationEnum('recommendation'),
    commentsToAuthor: text('comments_to_author'),
    commentsToChair: text('comments_to_chair'),
    assignedAt: timestamp('assigned_at').notNull().defaultNow(),
    dueAt: timestamp('due_at'),
    submittedAt: timestamp('submitted_at'),
  },
  (table) => [
    uniqueIndex('reviews_submission_reviewer_idx').on(
      table.submissionId,
      table.reviewerId,
    ),
    index('reviews_reviewer_idx').on(table.reviewerId),
  ],
);

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  conference: one(conferences, {
    fields: [submissions.conferenceId],
    references: [conferences.id],
  }),
  submitter: one(users, {
    fields: [submissions.submitterId],
    references: [users.id],
  }),
  track: one(tracks, {
    fields: [submissions.trackId],
    references: [tracks.id],
  }),
  authors: many(submissionAuthors),
  files: many(submissionFiles),
  reviews: many(reviews),
}));

export const submissionAuthorsRelations = relations(
  submissionAuthors,
  ({ one }) => ({
    submission: one(submissions, {
      fields: [submissionAuthors.submissionId],
      references: [submissions.id],
    }),
  }),
);

export const submissionFilesRelations = relations(
  submissionFiles,
  ({ one }) => ({
    submission: one(submissions, {
      fields: [submissionFiles.submissionId],
      references: [submissions.id],
    }),
  }),
);

export const reviewsRelations = relations(reviews, ({ one }) => ({
  submission: one(submissions, {
    fields: [reviews.submissionId],
    references: [submissions.id],
  }),
  reviewer: one(users, {
    fields: [reviews.reviewerId],
    references: [users.id],
  }),
}));

export type Submission = typeof submissions.$inferSelect;
export type SubmissionAuthor = typeof submissionAuthors.$inferSelect;
export type SubmissionFile = typeof submissionFiles.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type SubmissionStatus = (typeof submissionStatusEnum.enumValues)[number];
