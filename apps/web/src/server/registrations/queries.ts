import "server-only";

import { and, asc, count, desc, eq, gte, isNull, lte, or } from "drizzle-orm";

import { db } from "@/server/db";
import {
  payments,
  registrationTiers,
  registrations,
  submissions,
} from "@/server/db/schema";

/**
 * Tiers whose date window contains `now` and whose quota is not exhausted.
 * "Early bird" simply stops appearing once its `validUntil` passes.
 */
export async function getAvailableTiers(
  conferenceId: number,
  now = new Date(),
) {
  const rows = await db
    .select()
    .from(registrationTiers)
    .where(
      and(
        eq(registrationTiers.conferenceId, conferenceId),
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
      remaining:
        tier.quota === null ? null : tier.quota - (await countSold(tier.id)),
    })),
  );

  return withQuota.filter(
    (tier) => tier.remaining === null || tier.remaining > 0,
  );
}

/** Sold = paid, plus reservations still inside their payment window. */
async function countSold(tierId: number) {
  const [row] = await db
    .select({ value: count() })
    .from(registrations)
    .where(
      and(
        eq(registrations.tierId, tierId),
        or(
          eq(registrations.status, "paid"),
          eq(registrations.status, "pending_payment"),
        ),
      ),
    );
  return row?.value ?? 0;
}

export async function getMyRegistrations(userId: string, conferenceId: number) {
  return db
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
        eq(registrations.conferenceId, conferenceId),
      ),
    )
    .orderBy(desc(registrations.createdAt));
}

export async function getRegistrationDetail(
  registrationId: number,
  userId?: string,
) {
  const conditions = [eq(registrations.id, registrationId)];
  if (userId) conditions.push(eq(registrations.userId, userId));

  const [row] = await db
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

  if (!row) return null;

  const paymentRows = await db
    .select()
    .from(payments)
    .where(eq(payments.registrationId, registrationId))
    .orderBy(desc(payments.createdAt));

  return { ...row, payments: paymentRows };
}

export async function listRegistrations(conferenceId: number) {
  return db
    .select({
      registration: registrations,
      tier: registrationTiers,
    })
    .from(registrations)
    .innerJoin(
      registrationTiers,
      eq(registrations.tierId, registrationTiers.id),
    )
    .where(eq(registrations.conferenceId, conferenceId))
    .orderBy(desc(registrations.createdAt));
}

/** Headline numbers for the admin dashboard. */
export async function getRegistrationStats(conferenceId: number) {
  const rows = await db
    .select({
      status: registrations.status,
      total: count(),
    })
    .from(registrations)
    .where(eq(registrations.conferenceId, conferenceId))
    .groupBy(registrations.status);

  const byStatus = Object.fromEntries(rows.map((r) => [r.status, r.total]));

  return {
    paid: byStatus.paid ?? 0,
    pending: byStatus.pending_payment ?? 0,
    cancelled: byStatus.cancelled ?? 0,
    refunded: byStatus.refunded ?? 0,
  };
}
