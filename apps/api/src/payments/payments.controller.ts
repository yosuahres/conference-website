import { Body, Controller, HttpCode, Logger, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { WEBHOOK_THROTTLE } from '../common/throttling/throttler.config';
import { MidtransService, type MidtransNotification } from './midtrans.service';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly midtrans: MidtransService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post('webhook/midtrans')
  @HttpCode(200)
  // Deliberately loose: Midtrans delivers settlement batches in clumps and a
  // throttled notification is a payment this system never learns about. The
  // 30-minute reconcile job is the backstop, but a ceiling this high means we
  // should never need it. It exists only to bound a flood.
  @Throttle(WEBHOOK_THROTTLE)
  async midtransWebhook(@Body() notification: MidtransNotification) {
    if (!this.midtrans.verifyNotificationSignature(notification)) {
      this.logger.warn(
        `rejected notification with bad signature for order ${notification.order_id}`,
      );
      return { message: 'invalid signature' };
    }

    const result = await this.paymentsService.applyNotification(notification);
    return { received: true, ...result };
  }
}
