import { Global, Injectable, Logger, Module } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { EmailService } from './email.service';

/**
 * The retry sweep. Replaces the cron HTTP route the Next-only version needed —
 * a long-running Nest process can schedule its own work.
 */
@Injectable()
export class EmailRetryJob {
  private readonly logger = new Logger(EmailRetryJob.name);

  constructor(private readonly emailService: EmailService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async retryFailedEmails() {
    const result = await this.emailService.retryFailed();
    if (result.examined > 0) {
      this.logger.log(
        `retried ${result.examined} failed email(s), ${result.sent} sent`,
      );
    }
  }
}

@Global()
@Module({
  providers: [EmailService, EmailRetryJob],
  exports: [EmailService],
})
export class EmailModule {}
