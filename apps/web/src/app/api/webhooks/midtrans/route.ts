import { NextResponse } from "next/server";

import {
  verifyNotificationSignature,
  type MidtransNotification,
} from "@/server/payment/midtrans";
import { applyNotification } from "@/server/payment/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Midtrans HTTP notification endpoint. Configure this URL in the Midtrans
 * dashboard under Settings → Configuration → Payment Notification URL.
 *
 * Midtrans retries non-2xx responses for up to 24 hours, so we only return an
 * error for problems a retry could actually fix. A bad signature returns 200 —
 * retrying it would change nothing and would keep the queue busy forever.
 */
export async function POST(request: Request) {
  let notification: MidtransNotification;

  try {
    notification = (await request.json()) as MidtransNotification;
  } catch {
    return NextResponse.json({ message: "invalid json" }, { status: 400 });
  }

  if (!verifyNotificationSignature(notification)) {
    console.warn(
      `[midtrans] rejected notification with bad signature for order ${notification.order_id}`,
    );
    return NextResponse.json({ message: "invalid signature" }, { status: 200 });
  }

  try {
    const result = await applyNotification(notification);
    return NextResponse.json({ received: true, ...result }, { status: 200 });
  } catch (cause) {
    // Database hiccup — let Midtrans retry.
    console.error("[midtrans] failed to apply notification:", cause);
    return NextResponse.json({ message: "retry" }, { status: 500 });
  }
}
