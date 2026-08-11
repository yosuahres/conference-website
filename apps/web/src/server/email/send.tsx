import "server-only";

import { and, eq, lt } from "drizzle-orm";
import { Resend } from "resend";

import { db } from "@/server/db";
import { emailLog } from "@/server/db/schema";
import { env } from "@/server/env";
import {
  isTemplateKey,
  renderTemplate,
  type TemplateKey,
  type TemplateProps,
} from "./templates/registry";

const resend = new Resend(env.RESEND_API_KEY);

/** Give up after this many tries; the row stays `failed` for the committee to see. */
const MAX_ATTEMPTS = 3;

interface SendEmailArgs<K extends TemplateKey> {
  to: string;
  subject: string;
  template: K;
  props: TemplateProps[K];
  relatedType?: "submission" | "registration" | "payment" | "user";
  relatedId?: number;
}

/**
 * Logs first, sends second. If the process dies between the two, the row is
 * left `queued` and `retryPendingEmails` picks it up — the failure mode is a
 * late email, never a silently lost one.
 *
 * Never throws: a payment webhook must not 500 because Resend is down.
 */
export async function sendEmail<K extends TemplateKey>({
  to,
  subject,
  template,
  props,
  relatedType,
  relatedId,
}: SendEmailArgs<K>): Promise<{ ok: boolean; id: number }> {
  const [row] = await db
    .insert(emailLog)
    .values({
      toEmail: to,
      subject,
      template,
      // Stored so a retry can re-render the template hours later; the shape is
      // checked again on the way out by `isTemplateKey` + the renderer.
      payload: props as unknown as Record<string, unknown>,
      relatedType,
      relatedId,
      status: "queued",
    })
    .returning({ id: emailLog.id });

  const ok = await deliver(row!.id, to, subject, template, props, 0);
  return { ok, id: row!.id };
}

async function deliver<K extends TemplateKey>(
  logId: number,
  to: string,
  subject: string,
  template: K,
  props: TemplateProps[K],
  previousAttempts: number,
): Promise<boolean> {
  const attempts = previousAttempts + 1;

  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      react: renderTemplate(template, props),
    });

    if (error) throw new Error(error.message);

    await db
      .update(emailLog)
      .set({
        status: "sent",
        attempts,
        providerMessageId: data?.id ?? null,
        error: null,
        sentAt: new Date(),
      })
      .where(eq(emailLog.id, logId));

    return true;
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    console.error(`[email] ${template} -> ${to} failed:`, message);

    await db
      .update(emailLog)
      .set({ status: "failed", attempts, error: message })
      .where(eq(emailLog.id, logId));

    return false;
  }
}

/**
 * Called by the cron route. Re-renders each stalled email from its stored props
 * and tries again.
 */
export async function retryPendingEmails(limit = 25) {
  const stalled = await db
    .select()
    .from(emailLog)
    .where(
      and(eq(emailLog.status, "failed"), lt(emailLog.attempts, MAX_ATTEMPTS)),
    )
    .limit(limit);

  let sent = 0;
  for (const row of stalled) {
    if (!isTemplateKey(row.template)) {
      // Template was renamed or removed since the row was written.
      await db
        .update(emailLog)
        .set({ attempts: MAX_ATTEMPTS, error: "unknown template" })
        .where(eq(emailLog.id, row.id));
      continue;
    }

    const ok = await deliver(
      row.id,
      row.toEmail,
      row.subject,
      row.template,
      row.payload as never,
      row.attempts,
    );
    if (ok) sent += 1;
  }

  return { examined: stalled.length, sent };
}

/** Thin wrapper so the auth config does not need to know about template keys. */
export async function sendMagicLinkEmail({
  to,
  name,
  url,
  purpose,
}: {
  to: string;
  name?: string;
  url: string;
  purpose: "verify" | "sign-in";
}) {
  const { getActiveConferenceName } = await import(
    "@/server/conference/queries"
  );
  const conferenceName = await getActiveConferenceName();

  await sendEmail({
    to,
    subject:
      purpose === "verify"
        ? `Confirm your email — ${conferenceName}`
        : `Your sign-in link — ${conferenceName}`,
    template: "magic-link",
    props: { conferenceName, name, url, purpose },
    relatedType: "user",
  });
}
