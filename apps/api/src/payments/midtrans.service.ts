import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';

import type { PaymentStatus } from '../database/schemas/registrations';

export interface SnapTransactionInput {
  orderId: string;
  /** Whole rupiah. Midtrans rejects a non-integer gross_amount for IDR. */
  amount: number;
  customer: {
    firstName: string;
    lastName?: string;
    email: string;
    phone?: string | null;
  };
  item: { id: string; name: string };
  finishUrl: string;
  expiryMinutes?: number;
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

@Injectable()
export class MidtransService {
  private readonly logger = new Logger(MidtransService.name);
  private readonly serverKey: string;
  private readonly snapBase: string;
  private readonly coreBase: string;

  constructor(private readonly configService: ConfigService) {
    this.serverKey = this.configService.getOrThrow('MIDTRANS_SERVER_KEY');
    const isProduction =
      this.configService.get('MIDTRANS_IS_PRODUCTION') === 'true';

    this.snapBase = isProduction
      ? 'https://app.midtrans.com/snap/v1'
      : 'https://app.sandbox.midtrans.com/snap/v1';
    this.coreBase = isProduction
      ? 'https://api.midtrans.com/v2'
      : 'https://api.sandbox.midtrans.com/v2';
  }

  /** Basic auth with the server key as username and no password. */
  private get authHeader() {
    return `Basic ${Buffer.from(`${this.serverKey}:`).toString('base64')}`;
  }

  async createSnapTransaction(input: SnapTransactionInput) {
    const response = await fetch(`${this.snapBase}/transactions`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: this.authHeader,
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
            // Midtrans validates sum(price * quantity) === gross_amount.
            id: input.item.id,
            name: input.item.name.slice(0, 50),
            price: input.amount,
            quantity: 1,
          },
        ],
        callbacks: { finish: input.finishUrl },
        expiry: { unit: 'minute', duration: input.expiryMinutes ?? 60 * 24 },
      }),
    });

    const body = (await response.json()) as {
      token?: string;
      redirect_url?: string;
      error_messages?: string[];
    };

    if (!response.ok || !body.token || !body.redirect_url) {
      const reason = body.error_messages?.join('; ') ?? response.statusText;
      this.logger.error(`Snap transaction rejected: ${reason}`);
      throw new BadGatewayException(`Payment provider rejected the request.`);
    }

    return { token: body.token, redirectUrl: body.redirect_url };
  }

  /**
   * The webhook is public, so the signature is the only thing between an
   * attacker and a free conference ticket. Verify before anything else.
   */
  verifyNotificationSignature(notification: MidtransNotification): boolean {
    const expected = createHash('sha512')
      .update(
        notification.order_id +
          notification.status_code +
          notification.gross_amount +
          this.serverKey,
      )
      .digest('hex');

    const received = notification.signature_key ?? '';
    if (received.length !== expected.length) return false;

    // Constant-time compare so a wrong signature leaks no timing information.
    let diff = 0;
    for (let i = 0; i < expected.length; i += 1) {
      diff |= expected.charCodeAt(i) ^ received.charCodeAt(i);
    }
    return diff === 0;
  }

  /**
   * Collapses Midtrans' ten transaction states into the six we store. A
   * `capture` flagged for fraud review stays `pending` — the money is not ours.
   */
  mapTransactionStatus(
    notification: Pick<
      MidtransNotification,
      'transaction_status' | 'fraud_status'
    >,
  ): PaymentStatus {
    switch (notification.transaction_status) {
      case 'capture':
        return notification.fraud_status === 'accept' ? 'paid' : 'pending';
      case 'settlement':
        return 'paid';
      case 'authorize':
      case 'pending':
        return 'pending';
      case 'deny':
      case 'failure':
        return 'failed';
      case 'cancel':
        return 'cancelled';
      case 'expire':
        return 'expired';
      case 'refund':
      case 'partial_refund':
        return 'refunded';
      default:
        return 'pending';
    }
  }

  /** Webhooks get lost. This is the reconciliation path. */
  async fetchTransactionStatus(
    orderId: string,
  ): Promise<MidtransNotification | null> {
    const response = await fetch(`${this.coreBase}/${orderId}/status`, {
      headers: { Accept: 'application/json', Authorization: this.authHeader },
    });

    if (response.status === 404) return null;
    if (!response.ok) {
      throw new BadGatewayException(
        `Midtrans status check failed: ${response.statusText}`,
      );
    }

    return (await response.json()) as MidtransNotification;
  }
}
