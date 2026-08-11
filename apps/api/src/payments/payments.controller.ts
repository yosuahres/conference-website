import { Body, Controller, HttpCode, Logger, Post } from '@nestjs/common';

import { MidtransService, type MidtransNotification } from './midtrans.service';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly midtrans: MidtransService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * Midtrans HTTP notification endpoint. Set this URL in the Midtrans dashboard
   * under Settings -> Configuration -> Payment Notification URL.
   *
   * Midtrans retries non-2xx for up to 24 hours, so we only signal an error for
   * problems a retry could fix. A bad signature returns 200 — retrying it would
   * change nothing and would keep their queue busy for a day.
   */
  @Post('webhook/midtrans')
  @HttpCode(200)
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
