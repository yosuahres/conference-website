import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import {
  conferences,
  payments,
  registrationTiers,
  registrations,
  users,
} from "@/server/db/schema";
import { env } from "@/server/env";
import { sendEmail } from "@/server/email/send";
import { formatDateRange, formatDateTime } from "@/lib/format";
import {
  createSnapTransaction,
  fetchTransactionStatus,
  formatIdr,
  mapTransactionStatus,
  type MidtransNotification,
} from "./midtrans";

/** How long an attendee has to pay before the attempt expires. */
const PAYMENT_WINDOW_MINUTES = 60 * 24;

async function loadRegistrationContext(registrationId: number) {
  const [row] = await db
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

/**
 * Creates a fresh payment attempt and hands back a Snap token. Called on first
 * registration and again whenever an attendee retries an expired attempt —
 * each call gets its own `order_id` because Midtrans never lets one be reused.
 */
export async function startPayment(registrationId: number) {
  const context = await loadRegistrationContext(registrationId);
  if (!context) throw new Error(`Unknown registration ${registrationId}`);

  const { registration, tier, user } = context;

  if (registration.status === "paid") {
    throw new Error("This registration is already paid.");
  }

  const attempts = await db
    .select({ id: payments.id })
    .from(payments)
    .where(eq(payments.registrationId, registrationId));

  const orderId = `${registration.invoiceNumber}-${attempts.length + 1}`;
  const expiresAt = new Date(Date.now() + PAYMENT_WINDOW_MINUTES * 60_000);

  const [firstName, ...rest] = registration.fullName.trim().split(/\s+/);

  const snap = await createSnapTransaction({
    orderId,
    amount: registration.amount,
    customer: {
      firstName: firstName ?? registration.fullName,
      lastName: rest.join(" ") || undefined,
      email: user.email,
      phone: registration.phone,
    },
    item: { id: `tier-${tier.id}`, name: tier.name },
    finishUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard/registration/${registration.id}`,
    expiryMinutes: PAYMENT_WINDOW_MINUTES,
  });

  const [payment] = await db
    .insert(payments)
    .values({
      registrationId,
      provider: "midtrans",
      providerOrderId: orderId,
      amount: registration.amount,
      currency: registration.currency,
      status: "pending",
      expiresAt,
    })
    .returning();

  return {
    payment: payment!,
    snapToken: snap.token,
    redirectUrl: snap.redirectUrl,
    expiresAt,
  };
}

/**
 * The single place a payment outcome is written. Both the webhook and the
 * reconciliation cron funnel through here, and it is safe to call repeatedly
 * with the same notification.
 */
export async function applyNotification(notification: MidtransNotification) {
  const orderId = notification.order_id;

  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.providerOrderId, orderId))
    .limit(1);

  if (!payment) {
    console.warn(`[payment] notification for unknown order ${orderId}`);
    return { handled: false as const };
  }

  const nextStatus = mapTransactionStatus(notification);

  // Idempotency: a repeated "settlement" callback must not resend the receipt.
  if (payment.status === nextStatus) {
    return { handled: true as const, changed: false as const };
  }

  // Never walk a settled payment backwards on a late-arriving stale callback.
  if (payment.status === "paid" && nextStatus !== "refunded") {
    return { handled: true as const, changed: false as const };
  }

  const paidAt =
    nextStatus === "paid"
      ? new Date(
          notification.settlement_time ??
            notification.transaction_time ??
            Date.now(),
        )
      : null;

  await db
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

  if (nextStatus === "paid") {
    await db
      .update(registrations)
      .set({ status: "paid", paidAt, updatedAt: new Date() })
      .where(eq(registrations.id, payment.registrationId));

    await sendReceipt(payment.registrationId, notification);
  }

  if (nextStatus === "refunded") {
    await db
      .update(registrations)
      .set({ status: "refunded", updatedAt: new Date() })
      .where(eq(registrations.id, payment.registrationId));
  }

  return { handled: true as const, changed: true as const, status: nextStatus };
}

async function sendReceipt(
  registrationId: number,
  notification: MidtransNotification,
) {
  const context = await loadRegistrationContext(registrationId);
  if (!context) return;

  const { registration, tier, user, conference } = context;

  await sendEmail({
    to: user.email,
    subject: `Registration confirmed — ${registration.invoiceNumber}`,
    template: "payment-receipt",
    props: {
      conferenceName: conference.name,
      attendeeName: registration.fullName,
      invoiceNumber: registration.invoiceNumber,
      tierName: tier.name,
      amountFormatted: formatIdr(registration.amount),
      method: notification.payment_type ?? null,
      paidAt: formatDateTime(
        notification.settlement_time ?? new Date(),
        conference.timezone,
      ),
      conferenceDates: formatDateRange(conference.startsOn, conference.endsOn),
      venue: conference.venueName,
      dashboardUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard/registration/${registration.id}`,
    },
    relatedType: "registration",
    relatedId: registration.id,
  });
}

/**
 * Re-asks Midtrans about every payment still sitting in `pending`. Run from the
 * cron route — this is what saves a registration whose webhook was dropped.
 */
export async function reconcilePendingPayments(limit = 50) {
  const pending = await db
    .select({ orderId: payments.providerOrderId })
    .from(payments)
    .where(eq(payments.status, "pending"))
    .limit(limit);

  let updated = 0;
  for (const { orderId } of pending) {
    try {
      const status = await fetchTransactionStatus(orderId);
      if (!status) continue;
      const result = await applyNotification(status);
      if (result.handled && result.changed) updated += 1;
    } catch (cause) {
      console.error(`[payment] reconcile ${orderId} failed:`, cause);
    }
  }

  return { examined: pending.length, updated };
}
