import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';

import { formatDate, formatDateTime } from '../common/format';
import { ConferenceService } from '../conference/conference.service';
import { DATABASE_CONNECTION } from '../database/database-connection';
import type { DrizzleDatabase } from '../database/merged-schemas';
import { tracks } from '../database/schemas/conference';
import {
  reviews,
  submissionAuthors,
  submissionFiles,
  submissions,
  type SubmissionStatus,
} from '../database/schemas/submissions';
import { users, type User } from '../database/schemas/users';
import { EmailService } from '../email/email.service';
import {
  ALLOWED_MANUSCRIPT_TYPES,
  MAX_MANUSCRIPT_BYTES,
  StorageService,
} from '../storage/storage.service';
import {
  AssignReviewerDto,
  ConfirmUploadDto,
  DecisionDto,
  RequestUploadDto,
  ReviewDto,
  SaveSubmissionDto,
} from './dto/submission.dto';
import { assertTransition, isEditableByAuthor } from './submission-state';

@Injectable()
export class SubmissionsService {
  constructor(
    private readonly conferenceService: ConferenceService,
    private readonly emailService: EmailService,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
    @Inject(DATABASE_CONNECTION)
    private readonly database: DrizzleDatabase,
  ) {}

  private webUrl() {
    return this.configService.getOrThrow<string>('WEB_APP_URL');
  }

  private buildReference(conferenceSlug: string, id: number) {
    const prefix = conferenceSlug
      .replace(/[^a-z0-9]/gi, '')
      .toUpperCase()
      .slice(0, 6);
    return `${prefix || 'SUB'}-${String(id).padStart(4, '0')}`;
  }

  async listMine(userId: number) {
    const conference = await this.conferenceService.requireActive();
    return this.database
      .select({ submission: submissions, track: tracks })
      .from(submissions)
      .leftJoin(tracks, eq(submissions.trackId, tracks.id))
      .where(
        and(
          eq(submissions.submitterId, userId),
          eq(submissions.conferenceId, conference.id),
        ),
      )
      .orderBy(desc(submissions.updatedAt));
  }

  async getDetail(
    submissionId: number,
    submitterId?: number,
    reviewerId?: number,
  ) {
    if (reviewerId) {
      const [assignment] = await this.database
        .select({ id: reviews.id })
        .from(reviews)
        .where(
          and(
            eq(reviews.submissionId, submissionId),
            eq(reviews.reviewerId, reviewerId),
          ),
        )
        .limit(1);

      if (!assignment) {
        throw new ForbiddenException(
          'You are not assigned to review this submission.',
        );
      }
    }

    const conditions = [eq(submissions.id, submissionId)];
    if (submitterId) conditions.push(eq(submissions.submitterId, submitterId));

    const [row] = await this.database
      .select({ submission: submissions, track: tracks, submitter: users })
      .from(submissions)
      .leftJoin(tracks, eq(submissions.trackId, tracks.id))
      .innerJoin(users, eq(submissions.submitterId, users.id))
      .where(and(...conditions))
      .limit(1);

    if (!row) throw new NotFoundException('Submission not found.');

    const [authors, files, reviewRows] = await Promise.all([
      this.database
        .select()
        .from(submissionAuthors)
        .where(eq(submissionAuthors.submissionId, submissionId))
        .orderBy(asc(submissionAuthors.sortOrder)),
      this.database
        .select()
        .from(submissionFiles)
        .where(eq(submissionFiles.submissionId, submissionId))
        .orderBy(desc(submissionFiles.uploadedAt)),
      this.database
        .select({ review: reviews, reviewer: users })
        .from(reviews)
        .innerJoin(users, eq(reviews.reviewerId, users.id))
        .where(eq(reviews.submissionId, submissionId)),
    ]);

    return {
      ...row,
      submitter: {
        id: row.submitter.id,
        name: row.submitter.name,
        email: row.submitter.email,
      },
      authors,
      files,
      reviews: reviewRows.map(({ review, reviewer }) => ({
        ...review,
        reviewer: { id: reviewer.id, name: reviewer.name },
      })),
    };
  }

  async listAll(statuses?: SubmissionStatus[]) {
    const conference = await this.conferenceService.requireActive();
    const conditions = [eq(submissions.conferenceId, conference.id)];
    if (statuses?.length)
      conditions.push(inArray(submissions.status, statuses));

    const rows = await this.database
      .select({ submission: submissions, track: tracks, submitter: users })
      .from(submissions)
      .leftJoin(tracks, eq(submissions.trackId, tracks.id))
      .innerJoin(users, eq(submissions.submitterId, users.id))
      .where(and(...conditions))
      .orderBy(desc(submissions.submittedAt), desc(submissions.createdAt));

    return rows.map((row) => ({
      ...row,
      submitter: {
        id: row.submitter.id,
        name: row.submitter.name,
        email: row.submitter.email,
      },
    }));
  }

  async listRegisterable(userId: number) {
    const conference = await this.conferenceService.requireActive();
    return this.database
      .select({
        id: submissions.id,
        reference: submissions.reference,
        title: submissions.title,
      })
      .from(submissions)
      .where(
        and(
          eq(submissions.submitterId, userId),
          eq(submissions.conferenceId, conference.id),
          inArray(submissions.status, ['accepted', 'camera_ready_submitted']),
        ),
      )
      .orderBy(asc(submissions.reference));
  }

  async saveDraft(user: User, dto: SaveSubmissionDto, submissionId?: number) {
    const conference = await this.conferenceService.requireActive();

    if (!this.conferenceService.isSubmissionOpen(conference)) {
      throw new BadRequestException('Submissions are closed.');
    }

    if (dto.authors.filter((author) => author.isCorresponding).length !== 1) {
      throw new BadRequestException('Mark exactly one corresponding author.');
    }

    if (dto.trackId != null) {
      const [track] = await this.database
        .select({ id: tracks.id })
        .from(tracks)
        .where(
          and(
            eq(tracks.id, dto.trackId),
            eq(tracks.conferenceId, conference.id),
          ),
        )
        .limit(1);
      if (!track) {
        throw new BadRequestException(
          'That track is not part of this conference.',
        );
      }
    }

    const id = await this.database.transaction(async (tx) => {
      let targetId = submissionId;

      if (targetId) {
        const [existing] = await tx
          .select()
          .from(submissions)
          .where(
            and(
              eq(submissions.id, targetId),
              eq(submissions.submitterId, user.id),
            ),
          )
          .limit(1);

        if (!existing) throw new NotFoundException('Submission not found.');
        if (!isEditableByAuthor(existing.status)) {
          throw new ForbiddenException(
            'This submission is with the committee and can no longer be edited.',
          );
        }

        await tx
          .update(submissions)
          .set({
            title: dto.title,
            abstract: dto.abstract,
            keywords: dto.keywords,
            type: dto.type,
            trackId: dto.trackId ?? null,
            updatedAt: new Date(),
          })
          .where(eq(submissions.id, targetId));
      } else {
        const [created] = await tx
          .insert(submissions)
          .values({
            conferenceId: conference.id,
            submitterId: user.id,
            trackId: dto.trackId ?? null,
            reference: `tmp-${randomUUID()}`,
            title: dto.title,
            abstract: dto.abstract,
            keywords: dto.keywords,
            type: dto.type,
            status: 'draft',
          })
          .returning({ id: submissions.id });

        targetId = created.id;
        await tx
          .update(submissions)
          .set({ reference: this.buildReference(conference.slug, targetId) })
          .where(eq(submissions.id, targetId));
      }

      await tx
        .delete(submissionAuthors)
        .where(eq(submissionAuthors.submissionId, targetId));

      await tx.insert(submissionAuthors).values(
        dto.authors.map((author, index) => ({
          submissionId: targetId as number,
          name: author.name,
          email: author.email.toLowerCase(),
          affiliation: author.affiliation ?? null,
          country: author.country ?? null,
          isCorresponding: author.isCorresponding ? 1 : 0,
          sortOrder: index,
        })),
      );

      return targetId;
    });

    return { id };
  }

  async requestUploadUrl(
    user: User,
    submissionId: number,
    dto: RequestUploadDto,
  ) {
    const conference = await this.conferenceService.requireActive();

    if (!ALLOWED_MANUSCRIPT_TYPES.includes(dto.contentType)) {
      throw new BadRequestException(
        'Only PDF and Word documents are accepted.',
      );
    }
    if (dto.sizeBytes > MAX_MANUSCRIPT_BYTES) {
      throw new BadRequestException('Files must be 25 MB or smaller.');
    }

    const submission = await this.findOwned(submissionId, user.id);

    const allowed =
      dto.kind === 'camera_ready'
        ? submission.status === 'accepted' ||
          submission.status === 'camera_ready_submitted'
        : isEditableByAuthor(submission.status);

    if (!allowed) {
      throw new ForbiddenException('Uploads are not open for this submission.');
    }

    const version = await this.nextFileVersion(submissionId, dto.kind);
    const storageKey = this.storageService.buildSubmissionFileKey({
      conferenceSlug: conference.slug,
      submissionId,
      kind: dto.kind,
      version,
      fileName: dto.fileName,
    });

    const uploadUrl = await this.storageService.createUploadUrl(
      storageKey,
      dto.contentType,
      dto.sizeBytes,
    );

    return { uploadUrl, storageKey, version };
  }

  async confirmUpload(user: User, submissionId: number, dto: ConfirmUploadDto) {
    const conference = await this.conferenceService.requireActive();
    await this.findOwned(submissionId, user.id);

    if (!ALLOWED_MANUSCRIPT_TYPES.includes(dto.contentType)) {
      throw new BadRequestException(
        'Only PDF and Word documents are accepted.',
      );
    }

    // The client sends back a storageKey, but it is not the client's to choose.
    // Taking it at face value would let any author attach an arbitrary object
    // in the bucket -- another author's manuscript, say -- to their own
    // submission, and reviewers would then be served that file. Rebuilding the
    // key from the same inputs used to sign the upload means the only key that
    // can ever be stored is one we produced.
    const expectedKey = this.storageService.buildSubmissionFileKey({
      conferenceSlug: conference.slug,
      submissionId,
      kind: dto.kind,
      version: dto.version,
      fileName: dto.fileName,
    });

    if (expectedKey !== dto.storageKey) {
      throw new BadRequestException('That upload does not match this file.');
    }

    // And confirm something is actually there, at a size we allow. sizeBytes
    // from the request is a claim; ContentLength from S3 is a fact.
    const object = await this.storageService.statObject(expectedKey);
    if (!object) {
      throw new BadRequestException(
        'We could not find that upload. Please try again.',
      );
    }
    if (object.sizeBytes > MAX_MANUSCRIPT_BYTES) {
      await this.storageService.deleteObject(expectedKey);
      throw new BadRequestException('Files must be 25 MB or smaller.');
    }

    await this.database.insert(submissionFiles).values({
      submissionId,
      kind: dto.kind,
      storageKey: expectedKey,
      fileName: dto.fileName,
      mimeType: object.contentType || dto.contentType,
      sizeBytes: object.sizeBytes,
      version: dto.version,
    });

    if (dto.kind === 'camera_ready') {
      await this.database
        .update(submissions)
        .set({ status: 'camera_ready_submitted', updatedAt: new Date() })
        .where(eq(submissions.id, submissionId));
    }

    return { ok: true };
  }

  async submitForReview(user: User, submissionId: number) {
    const conference = await this.conferenceService.requireActive();
    if (!this.conferenceService.isSubmissionOpen(conference)) {
      throw new BadRequestException('The submission deadline has passed.');
    }

    const submission = await this.findOwned(submissionId, user.id);
    assertTransition(submission.status, 'submitted');

    const [manuscript] = await this.database
      .select({ id: submissionFiles.id })
      .from(submissionFiles)
      .where(
        and(
          eq(submissionFiles.submissionId, submissionId),
          eq(submissionFiles.kind, 'manuscript'),
        ),
      )
      .limit(1);

    if (!manuscript) {
      throw new BadRequestException(
        'Upload your manuscript before submitting.',
      );
    }

    const now = new Date();
    await this.database
      .update(submissions)
      .set({
        status: 'submitted',
        submittedAt: submission.submittedAt ?? now,
        updatedAt: now,
      })
      .where(eq(submissions.id, submissionId));

    const track = submission.trackId
      ? (
          await this.database
            .select({ name: tracks.name })
            .from(tracks)
            .where(eq(tracks.id, submission.trackId))
            .limit(1)
        )[0]
      : undefined;

    await this.emailService.send({
      to: user.email,
      template: 'submission-received',
      props: {
        authorName: user.name,
        reference: submission.reference,
        title: submission.title,
        track: track?.name ?? null,
        submittedAt: formatDateTime(now, conference.timezone),
        notificationDate: conference.notificationDate
          ? formatDate(conference.notificationDate, conference.timezone)
          : null,
        dashboardUrl: `${this.webUrl()}/dashboard/submissions/${submissionId}`,
      },
      relatedType: 'submission',
      relatedId: submissionId,
    });

    return { ok: true };
  }

  async withdraw(user: User, submissionId: number) {
    const submission = await this.findOwned(submissionId, user.id);
    assertTransition(submission.status, 'withdrawn');

    await this.database
      .update(submissions)
      .set({ status: 'withdrawn', updatedAt: new Date() })
      .where(eq(submissions.id, submissionId));

    return { ok: true };
  }

  async assignReviewer(submissionId: number, dto: AssignReviewerDto) {
    const [submission] = await this.database
      .select()
      .from(submissions)
      .where(eq(submissions.id, submissionId))
      .limit(1);
    if (!submission) throw new NotFoundException('Submission not found.');

    const [reviewer] = await this.database
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, dto.reviewerId))
      .limit(1);
    if (!reviewer) throw new NotFoundException('Reviewer not found.');

    await this.database
      .insert(reviews)
      .values({
        submissionId,
        reviewerId: dto.reviewerId,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
      })
      .onConflictDoNothing();

    if (submission.status === 'submitted') {
      await this.database
        .update(submissions)
        .set({ status: 'under_review', updatedAt: new Date() })
        .where(eq(submissions.id, submissionId));
    }

    return { ok: true };
  }

  async listAssignedTo(reviewerId: number) {
    return this.database
      .select({ review: reviews, submission: submissions })
      .from(reviews)
      .innerJoin(submissions, eq(reviews.submissionId, submissions.id))
      .where(eq(reviews.reviewerId, reviewerId))
      .orderBy(asc(reviews.dueAt));
  }

  async saveReview(reviewer: User, submissionId: number, dto: ReviewDto) {
    const [assignment] = await this.database
      .select({ id: reviews.id })
      .from(reviews)
      .where(
        and(
          eq(reviews.submissionId, submissionId),
          eq(reviews.reviewerId, reviewer.id),
        ),
      )
      .limit(1);

    if (!assignment) {
      throw new ForbiddenException('You are not assigned to this submission.');
    }

    await this.database
      .update(reviews)
      .set({
        score: dto.score,
        recommendation: dto.recommendation,
        commentsToAuthor: dto.commentsToAuthor,
        commentsToChair: dto.commentsToChair ?? null,
        submittedAt: new Date(),
      })
      .where(eq(reviews.id, assignment.id));

    return { ok: true };
  }

  async recordDecision(submissionId: number, dto: DecisionDto) {
    const conference = await this.conferenceService.requireActive();

    const [row] = await this.database
      .select({ submission: submissions, submitter: users })
      .from(submissions)
      .innerJoin(users, eq(submissions.submitterId, users.id))
      .where(eq(submissions.id, submissionId))
      .limit(1);

    if (!row) throw new NotFoundException('Submission not found.');
    assertTransition(row.submission.status, dto.decision);

    await this.database
      .update(submissions)
      .set({
        status: dto.decision,
        decidedAt: new Date(),
        decisionNote: dto.note ?? null,
        updatedAt: new Date(),
      })
      .where(eq(submissions.id, submissionId));

    const comments = dto.shareReviewerComments
      ? (
          await this.database
            .select({ text: reviews.commentsToAuthor })
            .from(reviews)
            .where(eq(reviews.submissionId, submissionId))
        )
          .map((review) => review.text)
          .filter((text): text is string => Boolean(text))
      : [];

    await this.emailService.send({
      to: row.submitter.email,
      template: 'submission-decision',
      props: {
        authorName: row.submitter.name,
        reference: row.submission.reference,
        title: row.submission.title,
        decision: dto.decision,
        decisionNote: dto.note ?? null,
        reviewerComments: comments,
        cameraReadyDeadline: conference.cameraReadyDeadline
          ? formatDate(conference.cameraReadyDeadline, conference.timezone)
          : null,
        actionUrl:
          dto.decision === 'accepted'
            ? `${this.webUrl()}/dashboard/register`
            : `${this.webUrl()}/dashboard/submissions/${submissionId}`,
      },
      relatedType: 'submission',
      relatedId: submissionId,
    });

    return { ok: true };
  }

  /**
   * Reviewers hold a role, not a blanket licence to read every manuscript in
   * the conference. Without the assignment check below, any reviewer could walk
   * fileId 1..n and pull down the full set, which is both a confidentiality
   * breach and the end of double-blind review.
   */
  async getFileDownloadUrl(actor: User, fileId: number) {
    const [file] = await this.database
      .select()
      .from(submissionFiles)
      .where(eq(submissionFiles.id, fileId))
      .limit(1);

    if (!file) throw new NotFoundException('File not found.');

    if (actor.role !== 'admin') {
      const [assignment] = await this.database
        .select({ id: reviews.id })
        .from(reviews)
        .where(
          and(
            eq(reviews.submissionId, file.submissionId),
            eq(reviews.reviewerId, actor.id),
          ),
        )
        .limit(1);

      if (!assignment) {
        // Same shape as a missing file: a reviewer probing ids should not be
        // able to tell "exists but not yours" from "does not exist".
        throw new NotFoundException('File not found.');
      }
    }

    const url = await this.storageService.createDownloadUrl(
      file.storageKey,
      file.fileName,
    );
    return { url };
  }

  private async findOwned(submissionId: number, userId: number) {
    const [submission] = await this.database
      .select()
      .from(submissions)
      .where(
        and(
          eq(submissions.id, submissionId),
          eq(submissions.submitterId, userId),
        ),
      )
      .limit(1);

    if (!submission) throw new NotFoundException('Submission not found.');
    return submission;
  }

  private async nextFileVersion(submissionId: number, kind: string) {
    const rows = await this.database
      .select({ version: submissionFiles.version })
      .from(submissionFiles)
      .where(
        and(
          eq(submissionFiles.submissionId, submissionId),
          eq(submissionFiles.kind, kind as 'manuscript'),
        ),
      );
    return rows.reduce((max, row) => Math.max(max, row.version), 0) + 1;
  }
}
