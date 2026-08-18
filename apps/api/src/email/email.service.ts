import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, eq, lt } from 'drizzle-orm';
import { Resend } from 'resend';
import type { ReactElement } from 'react';

import { DATABASE_CONNECTION } from '../database/database-connection';
import type { DrizzleDatabase } from '../database/merged-schemas';
import { emailLog } from '../database/schemas/email';
import {
  isTemplateKey,
  renderTemplate,
  type TemplateKey,
  type TemplateProps,
  TEMPLATE_SUBJECTS,
} from './templates/registry';

const MAX_ATTEMPTS = 3;

export interface SendEmailArgs<K extends TemplateKey> {
  to: string;
  template: K;
  props: Omit<TemplateProps[K], 'conferenceName'>;
  subject?: string;
  relatedType?: 'submission' | 'registration' | 'payment' | 'user';
  relatedId?: number;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;

  constructor(
    private readonly configService: ConfigService,
    @Inject(DATABASE_CONNECTION)
    private readonly database: DrizzleDatabase,
  ) {
    this.resend = new Resend(
      this.configService.getOrThrow<string>('RESEND_API_KEY'),
    );
  }

  async send<K extends TemplateKey>(args: SendEmailArgs<K>) {
    const conferenceName = this.configService.get<string>(
      'CONFERENCE_NAME',
      'Conference',
    );
    const props = { ...args.props, conferenceName } as TemplateProps[K];
    const subject =
      args.subject ?? TEMPLATE_SUBJECTS[args.template](props, conferenceName);

    const [row] = await this.database
      .insert(emailLog)
      .values({
        toEmail: args.to,
        subject,
        template: args.template,
        payload: props as unknown as Record<string, unknown>,
        relatedType: args.relatedType,
        relatedId: args.relatedId,
        status: 'queued',
      })
      .returning({ id: emailLog.id });

    const ok = await this.deliver(
      row.id,
      args.to,
      subject,
      args.template,
      props,
      0,
    );
    return { ok, id: row.id };
  }

  private async deliver<K extends TemplateKey>(
    logId: number,
    to: string,
    subject: string,
    template: K,
    props: TemplateProps[K],
    previousAttempts: number,
  ): Promise<boolean> {
    const attempts = previousAttempts + 1;

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.configService.getOrThrow<string>('EMAIL_FROM'),
        to,
        subject,
        react: renderTemplate(template, props) as ReactElement,
      });

      if (error) throw new Error(error.message);

      await this.database
        .update(emailLog)
        .set({
          status: 'sent',
          attempts,
          providerMessageId: data?.id ?? null,
          error: null,
          sentAt: new Date(),
        })
        .where(eq(emailLog.id, logId));

      return true;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      this.logger.error(`${template} -> ${to} failed: ${message}`);

      await this.database
        .update(emailLog)
        .set({ status: 'failed', attempts, error: message })
        .where(eq(emailLog.id, logId));

      return false;
    }
  }

  async retryFailed(limit = 25) {
    const stalled = await this.database
      .select()
      .from(emailLog)
      .where(
        and(eq(emailLog.status, 'failed'), lt(emailLog.attempts, MAX_ATTEMPTS)),
      )
      .limit(limit);

    let sent = 0;
    for (const row of stalled) {
      if (!isTemplateKey(row.template)) {
        await this.database
          .update(emailLog)
          .set({ attempts: MAX_ATTEMPTS, error: 'unknown template' })
          .where(eq(emailLog.id, row.id));
        continue;
      }

      const ok = await this.deliver(
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
}
