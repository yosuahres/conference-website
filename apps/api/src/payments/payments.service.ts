import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { eq } from 'drizzle-orm';

import { formatDateRange, formatDateTime, formatMoney } from '../common/format';
import { DATABASE_CONNECTION } from '../database/database-connection';
import type { DrizzleDatabase } from '../database/merged-schemas';
import { conferences } from '../database/schemas/conference';
import {
  payments,
  registrationTiers,
  registrations,
} from '../database/schemas/registrations';
import { users } from '../database/schemas/users';
import { EmailService } from '../email/email.service';
import { MidtransService, type MidtransNotification } from './midtrans.service';

const PAYMENT_WINDOW_MINUTES = 60 * 24;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly midtrans: MidtransService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    @Inject(DATABASE_CONNECTION)
    private readonly database: DrizzleDatabase,
  ) {}

  private async loadContext(registrationId: number) {
    const [row] = await this.database
      .select({
        registration: registrations,
        tier: registrationTiers,
        user: users,
        conference: conferences,
      })
      .from(registrations)
      .innerJoin(
        registrationTiers,
        eq(registrations.tierId, registrationTiers.id),
      )
      .innerJoin(users, eq(registrations.userId, users.id))
      .innerJoin(conferences, eq(registrations.conferenceId, conferences.id))
      .where(eq(registrations.id, registrationId))
      .limit(1);

    return row ?? null;
  }

  async startPayment(registrationId: number) {
    const context = await this.loadContext(registrationId);
    if (!context) throw new BadRequestException('Unknown registration.');

    const { registration, tier, user } = context;
    if (registration.status === 'paid') {
      throw new BadRequestException('This registration is already paid.');
    }

    const attempts = await this.database
      .select({ id: payments.id })
      .from(payments)
      .where(eq(payments.registrationId, registrationId));

    const orderId = `${registration.invoiceNumber}-${attempts.length + 1}`;
    const expiresAt = new Date(Date.now() + PAYMENT_WINDOW_MINUTES * 60_000);
    const [firstName, ...rest] = registration.fullName.trim().split(/\s+/);

    const snap = await this.midtrans.createSnapTransaction({
      orderId,
      amount: registration.amount,
      customer: {
        firstName: firstName ?? registration.fullName,
        lastName: rest.join(' ') || undefined,
        email: user.email,
        phone: registration.phone,
      },
      item: { id: `tier-${tier.id}`, name: tier.name },
      finishUrl: `${this.configService.getOrThrow('WEB_APP_URL')}/dashboard/registration/${registration.id}`,
      expiryMinutes: PAYMENT_WINDOW_MINUTES,
    });

    const [payment] = await this.database
      .insert(payments)
      .values({
        registrationId,
        provider: 'midtrans',
        providerOrderId: orderId,
        amount: registration.amount,
        currency: registration.currency,
        status: 'pending',
        expiresAt,
      })
      .returning();

    return {
      payment,
      snapToken: snap.token,
      redirectUrl: snap.redirectUrl,
      expiresAt,
    };
  }

  async applyNotification(notification: MidtransNotification) {
    const [payment] = await this.database
      .select()
      .from(payments)
      .where(eq(payments.providerOrderId, notification.order_id))
      .limit(1);

    if (!payment) {
      this.logger.warn(
        `notification for unknown order ${notification.order_id}`,
      );
      return { handled: false as const };
    }

    // The signature covers order_id + status_code + gross_amount, so a mismatch
    // here is not a forgery -- it means the amount charged is not the amount
    // invoiced (a tier price edited mid-flight, or a Snap transaction recreated
    // with different details). Marking that 'paid' would seat an attendee who
    // underpaid, so refuse it and leave the payment pending for a human.
    const paidAmount = Number(notification.gross_amount);
    if (
      !Number.isFinite(paidAmount) ||
      Math.round(paidAmount) !== payment.amount
    ) {
      this.logger.error(
        `amount mismatch on order ${notification.order_id}: ` +
          `notified ${notification.gross_amount}, expected ${payment.amount}`,
      );
      return { handled: false as const };
    }

    const nextStatus = this.midtrans.mapTransactionStatus(notification);

    if (payment.status === nextStatus) {
      return { handled: true as const, changed: false as const };
    }

    if (payment.status === 'paid' && nextStatus !== 'refunded') {
      return { handled: true as const, changed: false as const };
    }

    const paidAt =
      nextStatus === 'paid'
        ? new Date(
            notification.settlement_time ??
              notification.transaction_time ??
              Date.now(),
          )
        : null;

    await this.database
      .update(payments)
      .set({
        status: nextStatus,
        providerTransactionId: notification.transaction_id ?? null,
        method: notification.payment_type ?? null,
        rawPayload: notification,
        paidAt,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    if (nextStatus === 'paid') {
      await this.database
        .update(registrations)
        .set({ status: 'paid', paidAt, updatedAt: new Date() })
        .where(eq(registrations.id, payment.registrationId));

      await this.sendReceipt(payment.registrationId, notification);
    }

    if (nextStatus === 'refunded') {
      await this.database
        .update(registrations)
        .set({ status: 'refunded', updatedAt: new Date() })
        .where(eq(registrations.id, payment.registrationId));
    }

    return {
      handled: true as const,
      changed: true as const,
      status: nextStatus,
    };
  }

  private async sendReceipt(
    registrationId: number,
    notification: MidtransNotification,
  ) {
    const context = await this.loadContext(registrationId);
    if (!context) return;

    const { registration, tier, user, conference } = context;

    await this.emailService.send({
      to: user.email,
      template: 'payment-receipt',
      props: {
        attendeeName: registration.fullName,
        invoiceNumber: registration.invoiceNumber,
        tierName: tier.name,
        amountFormatted: formatMoney(
          registration.amount,
          registration.currency,
        ),
        method: notification.payment_type ?? null,
        paidAt: formatDateTime(
          notification.settlement_time ?? new Date(),
          conference.timezone,
        ),
        conferenceDates: formatDateRange(
          conference.startsOn,
          conference.endsOn,
          conference.timezone,
        ),
        venue: conference.venueName,
        dashboardUrl: `${this.configService.getOrThrow('WEB_APP_URL')}/dashboard/registration/${registration.id}`,
      },
      relatedType: 'registration',
      relatedId: registration.id,
    });
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async reconcilePendingPayments(limit = 50) {
    const pending = await this.database
      .select({ orderId: payments.providerOrderId })
      .from(payments)
      .where(eq(payments.status, 'pending'))
      .limit(limit);

    let updated = 0;
    for (const { orderId } of pending) {
      try {
        const status = await this.midtrans.fetchTransactionStatus(orderId);
        if (!status) continue;
        const result = await this.applyNotification(status);
        if (result.handled && result.changed) updated += 1;
      } catch (cause) {
        this.logger.error(`reconcile ${orderId} failed: ${String(cause)}`);
      }
    }

    if (pending.length > 0) {
      this.logger.log(
        `reconciled ${pending.length} pending, ${updated} changed`,
      );
    }
    return { examined: pending.length, updated };
  }
}
