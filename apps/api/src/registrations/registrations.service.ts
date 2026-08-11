import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lte,
  or,
} from 'drizzle-orm';

import { formatDateTime, formatIdr } from '../common/format';
import { ConferenceService } from '../conference/conference.service';
import { DATABASE_CONNECTION } from '../database/database-connection';
import type { DrizzleDatabase } from '../database/merged-schemas';
import {
  payments,
  registrationTiers,
  registrations,
} from '../database/schemas/registrations';
import { submissions } from '../database/schemas/submissions';
import type { User } from '../database/schemas/users';
import { EmailService } from '../email/email.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateRegistrationDto } from './dto/registration.dto';

const PRESENTER_CATEGORIES = ['presenter', 'student_presenter'];

@Injectable()
export class RegistrationsService {
  constructor(
    private readonly conferenceService: ConferenceService,
    private readonly paymentsService: PaymentsService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    @Inject(DATABASE_CONNECTION)
    private readonly database: DrizzleDatabase,
  ) {}

  private buildInvoiceNumber(conferenceSlug: string, id: number) {
    const prefix = conferenceSlug
      .replace(/[^a-z0-9]/gi, '')
      .toUpperCase()
      .slice(0, 6);
    return `INV-${prefix || 'CONF'}-${String(id).padStart(5, '0')}`;
  }

  /**
   * Tiers whose date window contains now and whose quota is not exhausted.
   * "Early bird" simply stops appearing once its `validUntil` passes.
   */
  async getAvailableTiers(now = new Date()) {
    const conference = await this.conferenceService.requireActive();

    const rows = await this.database
      .select()
      .from(registrationTiers)
      .where(
        and(
          eq(registrationTiers.conferenceId, conference.id),
          eq(registrationTiers.isActive, true),
          or(
            isNull(registrationTiers.validFrom),
            lte(registrationTiers.validFrom, now),
          ),
          or(
            isNull(registrationTiers.validUntil),
            gte(registrationTiers.validUntil, now),
          ),
        ),
      )
      .orderBy(asc(registrationTiers.sortOrder), asc(registrationTiers.price));

    const withQuota = await Promise.all(
      rows.map(async (tier) => ({
        ...tier,
        priceFormatted: formatIdr(tier.price),
        remaining:
          tier.quota === null
            ? null
            : tier.quota - (await this.countSold(tier.id)),
      })),
    );

    return withQuota.filter((t) => t.remaining === null || t.remaining > 0);
  }

  /** Sold = paid, plus reservations still inside their payment window. */
  private async countSold(tierId: number) {
    const [row] = await this.database
      .select({ value: count() })
      .from(registrations)
      .where(
        and(
          eq(registrations.tierId, tierId),
          or(
            eq(registrations.status, 'paid'),
            eq(registrations.status, 'pending_payment'),
          ),
        ),
      );
    return row?.value ?? 0;
  }

  async listMine(userId: number) {
    const conference = await this.conferenceService.requireActive();
    return this.database
      .select({
        registration: registrations,
        tier: registrationTiers,
        submission: submissions,
      })
      .from(registrations)
      .innerJoin(
        registrationTiers,
        eq(registrations.tierId, registrationTiers.id),
      )
      .leftJoin(submissions, eq(registrations.submissionId, submissions.id))
      .where(
        and(
          eq(registrations.userId, userId),
          eq(registrations.conferenceId, conference.id),
        ),
      )
      .orderBy(desc(registrations.createdAt));
  }

  async getDetail(registrationId: number, userId?: number) {
    const conditions = [eq(registrations.id, registrationId)];
    if (userId) conditions.push(eq(registrations.userId, userId));

    const [row] = await this.database
      .select({
        registration: registrations,
        tier: registrationTiers,
        submission: submissions,
      })
      .from(registrations)
      .innerJoin(
        registrationTiers,
        eq(registrations.tierId, registrationTiers.id),
      )
      .leftJoin(submissions, eq(registrations.submissionId, submissions.id))
      .where(and(...conditions))
      .limit(1);

    if (!row) throw new NotFoundException('Registration not found.');

    const paymentRows = await this.database
      .select()
      .from(payments)
      .where(eq(payments.registrationId, registrationId))
      .orderBy(desc(payments.createdAt));

    return { ...row, payments: paymentRows };
  }

  async listAll() {
    const conference = await this.conferenceService.requireActive();
    return this.database
      .select({ registration: registrations, tier: registrationTiers })
      .from(registrations)
      .innerJoin(
        registrationTiers,
        eq(registrations.tierId, registrationTiers.id),
      )
      .where(eq(registrations.conferenceId, conference.id))
      .orderBy(desc(registrations.createdAt));
  }

  async getStats() {
    const conference = await this.conferenceService.requireActive();
    const rows = await this.database
      .select({ status: registrations.status, total: count() })
      .from(registrations)
      .where(eq(registrations.conferenceId, conference.id))
      .groupBy(registrations.status);

    const byStatus = Object.fromEntries(rows.map((r) => [r.status, r.total]));
    return {
      paid: byStatus.paid ?? 0,
      pending: byStatus.pending_payment ?? 0,
      cancelled: byStatus.cancelled ?? 0,
      refunded: byStatus.refunded ?? 0,
    };
  }

  /**
   * Reserves a place and immediately opens a payment. The registration exists
   * in `pending_payment` from this moment, which is what holds the quota slot.
   */
  async create(user: User, dto: CreateRegistrationDto) {
    const conference = await this.conferenceService.requireActive();

    if (!this.conferenceService.isRegistrationOpen(conference)) {
      throw new BadRequestException('Registration is closed.');
    }

    // One paid or in-flight registration per person per conference.
    const existing = await this.database
      .select({ id: registrations.id, status: registrations.status })
      .from(registrations)
      .where(
        and(
          eq(registrations.userId, user.id),
          eq(registrations.conferenceId, conference.id),
          inArray(registrations.status, ['paid', 'pending_payment']),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(
        existing[0].status === 'paid'
          ? 'You are already registered for this conference.'
          : 'You have a registration awaiting payment. Complete or cancel it first.',
      );
    }

    // Re-resolve the tier server-side; the client cannot pick an expired price.
    const available = await this.getAvailableTiers();
    const tier = available.find((candidate) => candidate.id === dto.tierId);
    if (!tier) {
      throw new BadRequestException(
        'That registration category is no longer available.',
      );
    }

    if (PRESENTER_CATEGORIES.includes(tier.category)) {
      if (!dto.submissionId) {
        throw new BadRequestException(
          'Presenter registration requires an accepted paper.',
        );
      }

      const [paper] = await this.database
        .select({ id: submissions.id })
        .from(submissions)
        .where(
          and(
            eq(submissions.id, dto.submissionId),
            eq(submissions.submitterId, user.id),
            eq(submissions.conferenceId, conference.id),
            inArray(submissions.status, ['accepted', 'camera_ready_submitted']),
          ),
        )
        .limit(1);

      if (!paper) {
        throw new BadRequestException(
          'We could not find an accepted paper under your account.',
        );
      }
    }

    const registrationId = await this.database.transaction(async (tx) => {
      const [created] = await tx
        .insert(registrations)
        .values({
          conferenceId: conference.id,
          userId: user.id,
          tierId: tier.id,
          submissionId: PRESENTER_CATEGORIES.includes(tier.category)
            ? (dto.submissionId ?? null)
            : null,
          invoiceNumber: `tmp-${randomUUID()}`,
          status: 'pending_payment',
          mode: dto.mode,
          // Snapshot the price — a later tier edit must not alter this invoice.
          amount: tier.price,
          currency: tier.currency,
          fullName: dto.fullName,
          affiliation: dto.affiliation ?? null,
          country: dto.country ?? null,
          phone: dto.phone ?? null,
          dietaryNotes: dto.dietaryNotes ?? null,
          needsVisaLetter: dto.needsVisaLetter,
        })
        .returning({ id: registrations.id });

      await tx
        .update(registrations)
        .set({
          invoiceNumber: this.buildInvoiceNumber(conference.slug, created.id),
        })
        .where(eq(registrations.id, created.id));

      return created.id;
    });

    // The row has to exist before the Snap call, because the order id derives
    // from the invoice number which derives from the row id. If the provider
    // then refuses, roll the reservation back — otherwise the attendee is left
    // holding a `pending_payment` row that occupies a quota slot and blocks
    // them from trying again.
    let payment: Awaited<ReturnType<typeof this.paymentsService.startPayment>>;
    try {
      payment = await this.paymentsService.startPayment(registrationId);
    } catch (cause) {
      await this.database
        .delete(registrations)
        .where(eq(registrations.id, registrationId));
      throw cause;
    }

    const [registration] = await this.database
      .select({ invoiceNumber: registrations.invoiceNumber })
      .from(registrations)
      .where(eq(registrations.id, registrationId))
      .limit(1);

    await this.emailService.send({
      to: user.email,
      template: 'payment-instructions',
      props: {
        attendeeName: dto.fullName,
        invoiceNumber: registration.invoiceNumber,
        tierName: tier.name,
        amountFormatted: formatIdr(tier.price),
        expiresAt: formatDateTime(payment.expiresAt, conference.timezone),
        payUrl: `${this.configService.getOrThrow('WEB_APP_URL')}/dashboard/registration/${registrationId}`,
      },
      relatedType: 'registration',
      relatedId: registrationId,
    });

    return {
      registrationId,
      snapToken: payment.snapToken,
      redirectUrl: payment.redirectUrl,
    };
  }

  /** Opens a new payment attempt for a registration whose attempt lapsed. */
  async retryPayment(user: User, registrationId: number) {
    const [registration] = await this.database
      .select()
      .from(registrations)
      .where(
        and(
          eq(registrations.id, registrationId),
          eq(registrations.userId, user.id),
        ),
      )
      .limit(1);

    if (!registration) throw new NotFoundException('Registration not found.');
    if (registration.status === 'paid') {
      throw new BadRequestException('This registration is already paid.');
    }
    if (registration.status !== 'pending_payment') {
      throw new BadRequestException('This registration can no longer be paid.');
    }

    const payment = await this.paymentsService.startPayment(registrationId);
    return {
      snapToken: payment.snapToken,
      redirectUrl: payment.redirectUrl,
    };
  }

  async cancel(user: User, registrationId: number) {
    const [registration] = await this.database
      .select({ status: registrations.status })
      .from(registrations)
      .where(
        and(
          eq(registrations.id, registrationId),
          eq(registrations.userId, user.id),
        ),
      )
      .limit(1);

    if (!registration) throw new NotFoundException('Registration not found.');
    if (registration.status !== 'pending_payment') {
      throw new BadRequestException(
        'Only unpaid registrations can be cancelled here.',
      );
    }

    await this.database
      .update(registrations)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(registrations.id, registrationId));

    return { ok: true };
  }

  /** CSV for the committee. Escapes against spreadsheet formula injection. */
  async exportCsv() {
    const conference = await this.conferenceService.requireActive();
    const rows = await this.listAll();

    const columns = [
      'Invoice',
      'Status',
      'Name',
      'Affiliation',
      'Country',
      'Phone',
      'Category',
      'Mode',
      'Amount',
      'Currency',
      'Dietary notes',
      'Visa letter',
      'Created',
      'Paid',
    ];

    const cell = (value: unknown) => {
      const text = value === null || value === undefined ? '' : String(value);
      const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
      return `"${guarded.replace(/"/g, '""')}"`;
    };

    const body = rows.map(({ registration, tier }) =>
      [
        registration.invoiceNumber,
        registration.status,
        registration.fullName,
        registration.affiliation,
        registration.country,
        registration.phone,
        tier.name,
        registration.mode,
        registration.amount,
        registration.currency,
        registration.dietaryNotes,
        registration.needsVisaLetter ? 'yes' : 'no',
        registration.createdAt.toISOString(),
        registration.paidAt?.toISOString() ?? '',
      ]
        .map(cell)
        .join(','),
    );

    return {
      filename: `${conference.slug}-registrations.csv`,
      // Leading BOM so Excel opens UTF-8 correctly.
      content: `﻿${[columns.map(cell).join(','), ...body].join('\r\n')}`,
    };
  }
}
