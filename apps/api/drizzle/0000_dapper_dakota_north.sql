CREATE TYPE "public"."email_status" AS ENUM('queued', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('attendee', 'reviewer', 'admin');--> statement-breakpoint
CREATE TYPE "public"."verification_purpose" AS ENUM('email_verification', 'password_reset');--> statement-breakpoint
CREATE TYPE "public"."review_recommendation" AS ENUM('accept', 'minor_revision', 'major_revision', 'reject');--> statement-breakpoint
CREATE TYPE "public"."submission_file_kind" AS ENUM('manuscript', 'camera_ready', 'supplementary', 'copyright_form');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('draft', 'submitted', 'under_review', 'revision_requested', 'accepted', 'rejected', 'camera_ready_submitted', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."submission_type" AS ENUM('abstract', 'full_paper', 'poster');--> statement-breakpoint
CREATE TYPE "public"."attendance_mode" AS ENUM('onsite', 'online');--> statement-breakpoint
CREATE TYPE "public"."attendee_category" AS ENUM('presenter', 'participant', 'student_presenter', 'student_participant');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'failed', 'expired', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."registration_status" AS ENUM('pending_payment', 'paid', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TABLE "conferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"edition" text,
	"tagline" text,
	"description" text,
	"starts_on" date,
	"ends_on" date,
	"venue_name" text,
	"venue_address" text,
	"city" text,
	"country" text,
	"timezone" text DEFAULT 'Asia/Jakarta' NOT NULL,
	"submission_opens_at" timestamp,
	"submission_deadline" timestamp,
	"notification_date" timestamp,
	"camera_ready_deadline" timestamp,
	"registration_deadline" timestamp,
	"contact_email" text,
	"website_url" text,
	"banner_image_key" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "conferences_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conference_id" integer NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"nav_label" text,
	"show_in_nav" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedule_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"conference_id" integer NOT NULL,
	"day" date NOT NULL,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp,
	"title" text NOT NULL,
	"description" text,
	"room" text,
	"speaker_id" integer
);
--> statement-breakpoint
CREATE TABLE "speakers" (
	"id" serial PRIMARY KEY NOT NULL,
	"conference_id" integer NOT NULL,
	"name" text NOT NULL,
	"title" text,
	"affiliation" text,
	"country" text,
	"bio" text,
	"photo_key" text,
	"is_keynote" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracks" (
	"id" serial PRIMARY KEY NOT NULL,
	"conference_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"to_email" text NOT NULL,
	"subject" text NOT NULL,
	"template" text NOT NULL,
	"payload" jsonb,
	"related_type" text,
	"related_id" integer,
	"status" "email_status" DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"provider_message_id" text,
	"error" text,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text,
	"refresh_token" text,
	"name" text NOT NULL,
	"role" "user_role" DEFAULT 'attendee' NOT NULL,
	"title" text,
	"affiliation" text,
	"country" text,
	"phone" text,
	"email_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token_hash" text NOT NULL,
	"purpose" "verification_purpose" NOT NULL,
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" integer NOT NULL,
	"reviewer_id" integer NOT NULL,
	"score" integer,
	"recommendation" "review_recommendation",
	"comments_to_author" text,
	"comments_to_chair" text,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"due_at" timestamp,
	"submitted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "submission_authors" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" integer NOT NULL,
	"user_id" integer,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"affiliation" text,
	"country" text,
	"is_corresponding" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" integer NOT NULL,
	"kind" "submission_file_kind" DEFAULT 'manuscript' NOT NULL,
	"storage_key" text NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"conference_id" integer NOT NULL,
	"submitter_id" integer NOT NULL,
	"track_id" integer,
	"reference" text NOT NULL,
	"title" text NOT NULL,
	"abstract" text NOT NULL,
	"keywords" text[] DEFAULT '{}' NOT NULL,
	"type" "submission_type" DEFAULT 'full_paper' NOT NULL,
	"status" "submission_status" DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp,
	"decided_at" timestamp,
	"decision_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"registration_id" integer NOT NULL,
	"provider" text DEFAULT 'midtrans' NOT NULL,
	"provider_order_id" text NOT NULL,
	"provider_transaction_id" text,
	"method" text,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'IDR' NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"raw_payload" jsonb,
	"expires_at" timestamp,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registration_tiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"conference_id" integer NOT NULL,
	"name" text NOT NULL,
	"category" "attendee_category" NOT NULL,
	"mode" "attendance_mode" DEFAULT 'onsite' NOT NULL,
	"price" integer NOT NULL,
	"currency" text DEFAULT 'IDR' NOT NULL,
	"description" text,
	"valid_from" timestamp,
	"valid_until" timestamp,
	"quota" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"conference_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"tier_id" integer NOT NULL,
	"submission_id" integer,
	"invoice_number" text NOT NULL,
	"status" "registration_status" DEFAULT 'pending_payment' NOT NULL,
	"mode" "attendance_mode" DEFAULT 'onsite' NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'IDR' NOT NULL,
	"full_name" text NOT NULL,
	"affiliation" text,
	"country" text,
	"phone" text,
	"dietary_notes" text,
	"needs_visa_letter" boolean DEFAULT false NOT NULL,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_conference_id_conferences_id_fk" FOREIGN KEY ("conference_id") REFERENCES "public"."conferences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_items" ADD CONSTRAINT "schedule_items_conference_id_conferences_id_fk" FOREIGN KEY ("conference_id") REFERENCES "public"."conferences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_items" ADD CONSTRAINT "schedule_items_speaker_id_speakers_id_fk" FOREIGN KEY ("speaker_id") REFERENCES "public"."speakers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speakers" ADD CONSTRAINT "speakers_conference_id_conferences_id_fk" FOREIGN KEY ("conference_id") REFERENCES "public"."conferences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_conference_id_conferences_id_fk" FOREIGN KEY ("conference_id") REFERENCES "public"."conferences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_authors" ADD CONSTRAINT "submission_authors_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_authors" ADD CONSTRAINT "submission_authors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_files" ADD CONSTRAINT "submission_files_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_conference_id_conferences_id_fk" FOREIGN KEY ("conference_id") REFERENCES "public"."conferences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_submitter_id_users_id_fk" FOREIGN KEY ("submitter_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_tiers" ADD CONSTRAINT "registration_tiers_conference_id_conferences_id_fk" FOREIGN KEY ("conference_id") REFERENCES "public"."conferences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_conference_id_conferences_id_fk" FOREIGN KEY ("conference_id") REFERENCES "public"."conferences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_tier_id_registration_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."registration_tiers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conferences_active_idx" ON "conferences" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "pages_conference_slug_idx" ON "pages" USING btree ("conference_id","slug");--> statement-breakpoint
CREATE INDEX "schedule_conference_day_idx" ON "schedule_items" USING btree ("conference_id","day");--> statement-breakpoint
CREATE INDEX "speakers_conference_idx" ON "speakers" USING btree ("conference_id");--> statement-breakpoint
CREATE INDEX "tracks_conference_idx" ON "tracks" USING btree ("conference_id");--> statement-breakpoint
CREATE INDEX "email_log_status_idx" ON "email_log" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_log_related_idx" ON "email_log" USING btree ("related_type","related_id");--> statement-breakpoint
CREATE INDEX "verification_tokens_hash_idx" ON "verification_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_submission_reviewer_idx" ON "reviews" USING btree ("submission_id","reviewer_id");--> statement-breakpoint
CREATE INDEX "reviews_reviewer_idx" ON "reviews" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "submission_authors_submission_idx" ON "submission_authors" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "submission_files_submission_idx" ON "submission_files" USING btree ("submission_id","kind");--> statement-breakpoint
CREATE UNIQUE INDEX "submissions_reference_idx" ON "submissions" USING btree ("conference_id","reference");--> statement-breakpoint
CREATE INDEX "submissions_submitter_idx" ON "submissions" USING btree ("submitter_id");--> statement-breakpoint
CREATE INDEX "submissions_status_idx" ON "submissions" USING btree ("conference_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_provider_order_idx" ON "payments" USING btree ("provider_order_id");--> statement-breakpoint
CREATE INDEX "payments_registration_idx" ON "payments" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX "registration_tiers_conference_idx" ON "registration_tiers" USING btree ("conference_id");--> statement-breakpoint
CREATE UNIQUE INDEX "registrations_invoice_idx" ON "registrations" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "registrations_user_idx" ON "registrations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "registrations_status_idx" ON "registrations" USING btree ("conference_id","status");