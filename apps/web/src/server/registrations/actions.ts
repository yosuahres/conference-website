"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";

import {
  attempt,
  fail,
  fieldErrorsOf,
  ok,
  type ActionResult,
} from "@/lib/action-result";
import { formatDateTime, formatIdr } from "@/lib/format";
import { registrationSchema } from "@/lib/validation/registration";
import { requireUser } from "@/server/auth/session";
import {
  isRegistrationOpen,
  requireActiveConference,
} from "@/server/conference/queries";
import { db } from "@/server/db";
import { registrations, submissions } from "@/server/db/schema";
import { sendEmail } from "@/server/email/send";
import { env } from "@/server/env";
import { startPayment } from "@/server/payment/service";
import { getAvailableTiers } from "./queries";

const PRESENTER_CATEGORIES = ["presenter", "student_presenter"] as const;

function buildInvoiceNumber(conferenceSlug: string, id: number) {
  const prefix = conferenceSlug
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 6);
  return `INV-${prefix || "CONF"}-${String(id).padStart(5, "0")}`;
}

/**
 * Reserves a place and immediately opens a payment. The registration exists in
 * `pending_payment` from this moment, which is what holds the quota slot.
 */
export async function createRegistration(input: unknown): Promise<
  ActionResult<{
    registrationId: number;
    snapToken: string;
    redirectUrl: string;
  }>
> {
  return attempt(async () => {
    const user = await requireUser();
    const conference = await requireActiveConference();

    const parsed = registrationSchema.safeParse(input);
    if (!parsed.success) {
      return fail(
        "Please correct the highlighted fields.",
        fieldErrorsOf(parsed.error),
      );
    }
    const data = parsed.data;

    if (!isRegistrationOpen(conference)) {
      return fail("Registration is closed for this conference.");
    }

    // One paid or in-flight registration per person per conference.
    const existing = await db
      .select({ id: registrations.id, status: registrations.status })
      .from(registrations)
      .where(
        and(
          eq(registrations.userId, user.id),
          eq(registrations.conferenceId, conference.id),
          inArray(registrations.status, ["paid", "pending_payment"]),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return fail(
        existing[0]!.status === "paid"
          ? "You are already registered for this conference."
          : "You have a registration awaiting payment. Complete or cancel it first.",
      );
    }

    // Re-resolve the tier server-side; the client cannot pick an expired price.
    const available = await getAvailableTiers(conference.id);
    const tier = available.find((candidate) => candidate.id === data.tierId);
    if (!tier) {
      return fail("That registration category is no longer available.");
    }

    if (PRESENTER_CATEGORIES.includes(tier.category as never)) {
      if (!data.submissionId) {
        return fail("Presenter registration requires an accepted paper.");
      }

      const [paper] = await db
        .select({ id: submissions.id })
        .from(submissions)
        .where(
          and(
            eq(submissions.id, data.submissionId),
            eq(submissions.submitterId, user.id),
            eq(submissions.conferenceId, conference.id),
            inArray(submissions.status, ["accepted", "camera_ready_submitted"]),
          ),
        )
        .limit(1);

      if (!paper) {
        return fail("We could not find an accepted paper under your account.");
      }
    }

    const registrationId = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(registrations)
        .values({
          conferenceId: conference.id,
          userId: user.id,
          tierId: tier.id,
          submissionId: data.submissionId ?? null,
          invoiceNumber: `tmp-${randomUUID()}`,
          status: "pending_payment",
          mode: data.mode,
          // Snapshot the price — a later tier edit must not alter this invoice.
          amount: tier.price,
          currency: tier.currency,
          fullName: data.fullName,
          affiliation: data.affiliation || null,
          country: data.country || null,
          phone: data.phone || null,
          dietaryNotes: data.dietaryNotes || null,
          needsVisaLetter: data.needsVisaLetter,
        })
        .returning({ id: registrations.id });

      await tx
        .update(registrations)
        .set({
          invoiceNumber: buildInvoiceNumber(conference.slug, created!.id),
        })
        .where(eq(registrations.id, created!.id));

      return created!.id;
    });

    const payment = await startPayment(registrationId);

    const [registration] = await db
      .select({ invoiceNumber: registrations.invoiceNumber })
      .from(registrations)
      .where(eq(registrations.id, registrationId))
      .limit(1);

    await sendEmail({
      to: user.email,
      subject: `Complete your registration — ${registration!.invoiceNumber}`,
      template: "payment-instructions",
      props: {
        conferenceName: conference.name,
        attendeeName: data.fullName,
        invoiceNumber: registration!.invoiceNumber,
        tierName: tier.name,
        amountFormatted: formatIdr(tier.price),
        expiresAt: formatDateTime(payment.expiresAt, conference.timezone),
        payUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard/registration/${registrationId}`,
      },
      relatedType: "registration",
      relatedId: registrationId,
    });

    revalidatePath("/dashboard");
    return ok({
      registrationId,
      snapToken: payment.snapToken,
      redirectUrl: payment.redirectUrl,
    });
  });
}

/**
 * Opens a new payment attempt for a registration whose previous attempt lapsed.
 * The old attempt stays in the table; Midtrans order ids are never reused.
 */
export async function retryPayment(
  registrationId: number,
): Promise<ActionResult<{ snapToken: string; redirectUrl: string }>> {
  return attempt(async () => {
    const user = await requireUser();

    const [registration] = await db
      .select()
      .from(registrations)
      .where(
        and(
          eq(registrations.id, registrationId),
          eq(registrations.userId, user.id),
        ),
      )
      .limit(1);

    if (!registration) return fail("Registration not found.");
    if (registration.status === "paid") {
      return fail("This registration is already paid.");
    }
    if (registration.status !== "pending_payment") {
      return fail("This registration can no longer be paid.");
    }

    const payment = await startPayment(registrationId);
    revalidatePath(`/dashboard/registration/${registrationId}`);
    return ok({
      snapToken: payment.snapToken,
      redirectUrl: payment.redirectUrl,
    });
  });
}

export async function cancelRegistration(
  registrationId: number,
): Promise<ActionResult<void>> {
  return attempt(async () => {
    const user = await requireUser();

    const [registration] = await db
      .select({ status: registrations.status })
      .from(registrations)
      .where(
        and(
          eq(registrations.id, registrationId),
          eq(registrations.userId, user.id),
        ),
      )
      .limit(1);

    if (!registration) return fail("Registration not found.");
    if (registration.status !== "pending_payment") {
      return fail("Only unpaid registrations can be cancelled here.");
    }

    await db
      .update(registrations)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(registrations.id, registrationId));

    revalidatePath("/dashboard");
    return ok();
  });
}

/** Cheapest currently-valid price per category, for the public pricing table. */
export async function getPublicPricing() {
  const conference = await requireActiveConference();
  const tiers = await getAvailableTiers(conference.id);
  return tiers.map((tier) => ({
    id: tier.id,
    name: tier.name,
    category: tier.category,
    mode: tier.mode,
    price: tier.price,
    priceFormatted: formatIdr(tier.price),
    description: tier.description,
    validUntil: tier.validUntil,
    remaining: tier.remaining,
  }));
}
