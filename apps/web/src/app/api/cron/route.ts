import { NextResponse } from "next/server";

import { retryPendingEmails } from "@/server/email/send";
import { reconcilePendingPayments } from "@/server/payment/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * The only background job in the system. Point a scheduler at it every 15
 * minutes (Vercel Cron, cron-job.org, or a plain crontab with curl) to retry
 * failed emails and reconcile payments whose webhook never arrived.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = request.headers.get("authorization");
    if (provided !== `Bearer ${secret}`) {
      return NextResponse.json({ message: "unauthorized" }, { status: 401 });
    }
  }

  const [emails, payments] = await Promise.all([
    retryPendingEmails(),
    reconcilePendingPayments(),
  ]);

  return NextResponse.json({ emails, payments });
}
