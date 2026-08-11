import "server-only";

import { createHash } from "node:crypto";

import type { PaymentStatus } from "@/server/db/schema";
import { env } from "@/server/env";

const SNAP_BASE = env.MIDTRANS_IS_PRODUCTION
  ? "https://app.midtrans.com/snap/v1"
  : "https://app.sandbox.midtrans.com/snap/v1";

const CORE_BASE = env.MIDTRANS_IS_PRODUCTION
  ? "https://api.midtrans.com/v2"
  : "https://api.sandbox.midtrans.com/v2";

/** Midtrans wants Basic auth with the server key as username and no password. */
const authHeader = `Basic ${Buffer.from(`${env.MIDTRANS_SERVER_KEY}:`).toString("base64")}`;

export interface SnapTransactionInput {
  orderId: string;
  /** Whole rupiah. Midtrans rejects non-integer gross_amount for IDR. */
  amount: number;
  customer: {
    firstName: string;
    lastName?: string;
    email: string;
    phone?: string | null;
  };
  item: {
    id: string;
    name: string;
  };
  finishUrl: string;
  /** Minutes until the payment window closes. */
  expiryMinutes?: number;
}

export interface SnapTransaction {
  token: string;
  redirectUrl: string;
}

export async function createSnapTransaction(
  input: SnapTransactionInput,
): Promise<SnapTransaction> {
  const response = await fetch(`${SNAP_BASE}/transactions`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: input.orderId,
        gross_amount: input.amount,
      },
      customer_details: {
        first_name: input.customer.firstName,
        last_name: input.customer.lastName,
        email: input.customer.email,
        phone: input.customer.phone ?? undefined,
      },
      item_details: [
        {
          // Midtrans validates that sum(price * quantity) === gross_amount.
          id: input.item.id,
          name: input.item.name.slice(0, 50),
          price: input.amount,
          quantity: 1,
        },
      ],
      callbacks: { finish: input.finishUrl },
      expiry: {
        unit: "minute",
        duration: input.expiryMinutes ?? 60 * 24,
      },
    }),
  });

  const body = (await response.json()) as {
    token?: string;
    redirect_url?: string;
    error_messages?: string[];
  };

  if (!response.ok || !body.token || !body.redirect_url) {
    throw new Error(
      `Midtrans rejected the transaction: ${
        body.error_messages?.join("; ") ?? response.statusText
      }`,
    );
  }

  return { token: body.token, redirectUrl: body.redirect_url };
}

export interface MidtransNotification {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  transaction_id?: string;
  transaction_time?: string;
  settlement_time?: string;
  payment_type?: string;
  fraud_status?: string;
  [key: string]: unknown;
}

/**
 * The webhook is a public endpoint, so the signature is the only thing standing
 * between an attacker and a free conference ticket. Verify before anything else.
 */
export function verifyNotificationSignature(
  notification: MidtransNotification,
): boolean {
  const expected = createHash("sha512")
    .update(
      notification.order_id +
        notification.status_code +
        notification.gross_amount +
        env.MIDTRANS_SERVER_KEY,
    )
    .digest("hex");

  const received = notification.signature_key ?? "";
  if (received.length !== expected.length) return false;

  // Constant-time compare so a wrong signature leaks no timing information.
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ received.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Collapses Midtrans' ten transaction states into the six we store. A `capture`
 * flagged for fraud review stays `pending` — the money is not ours yet.
 */
export function mapTransactionStatus(
  notification: Pick<
    MidtransNotification,
    "transaction_status" | "fraud_status"
  >,
): PaymentStatus {
  const { transaction_status: status, fraud_status: fraud } = notification;

  switch (status) {
    case "capture":
      return fraud === "accept" ? "paid" : "pending";
    case "settlement":
      return "paid";
    case "authorize":
    case "pending":
      return "pending";
    case "deny":
    case "failure":
      return "failed";
    case "cancel":
      return "cancelled";
    case "expire":
      return "expired";
    case "refund":
    case "partial_refund":
      return "refunded";
    default:
      return "pending";
  }
}

/**
 * Webhooks get lost. This is the reconciliation path: ask Midtrans directly
 * what happened to an order.
 */
export async function fetchTransactionStatus(
  orderId: string,
): Promise<MidtransNotification | null> {
  const response = await fetch(`${CORE_BASE}/${orderId}/status`, {
    headers: { Accept: "application/json", Authorization: authHeader },
    cache: "no-store",
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Midtrans status check failed: ${response.statusText}`);
  }

  return (await response.json()) as MidtransNotification;
}

/** IDR has no minor units; `Intl` would otherwise render "Rp 1.500.000,00". */
export function formatIdr(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
