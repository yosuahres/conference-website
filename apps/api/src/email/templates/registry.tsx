import type { ReactElement } from 'react';

import { MagicLinkEmail, type MagicLinkEmailProps } from './magic-link';
import {
  PaymentInstructionsEmail,
  type PaymentInstructionsEmailProps,
} from './payment-instructions';
import {
  PaymentReceiptEmail,
  type PaymentReceiptEmailProps,
} from './payment-receipt';
import {
  SubmissionDecisionEmail,
  type SubmissionDecisionEmailProps,
} from './submission-decision';
import {
  SubmissionReceivedEmail,
  type SubmissionReceivedEmailProps,
} from './submission-received';

/**
 * Every template is addressable by a stable string key. `email_log` stores that
 * key plus the props, which is what makes a retry possible hours later without
 * reconstructing the original call site.
 */
export interface TemplateProps {
  'magic-link': MagicLinkEmailProps;
  'submission-received': SubmissionReceivedEmailProps;
  'submission-decision': SubmissionDecisionEmailProps;
  'payment-instructions': PaymentInstructionsEmailProps;
  'payment-receipt': PaymentReceiptEmailProps;
}

export type TemplateKey = keyof TemplateProps;

const renderers: {
  [K in TemplateKey]: (props: TemplateProps[K]) => ReactElement;
} = {
  'magic-link': MagicLinkEmail,
  'submission-received': SubmissionReceivedEmail,
  'submission-decision': SubmissionDecisionEmail,
  'payment-instructions': PaymentInstructionsEmail,
  'payment-receipt': PaymentReceiptEmail,
};

/** Default subject per template, so call sites rarely have to pass one. */
export const TEMPLATE_SUBJECTS: {
  [K in TemplateKey]: (props: TemplateProps[K], conference: string) => string;
} = {
  'magic-link': (props, conference) =>
    props.purpose === 'verify'
      ? `Confirm your email — ${conference}`
      : props.purpose === 'reset'
        ? `Reset your password — ${conference}`
        : `Your sign-in link — ${conference}`,
  'submission-received': (props) => `Submission received — ${props.reference}`,
  'submission-decision': (props) =>
    props.decision === 'accepted'
      ? `Accepted — ${props.reference}`
      : `Decision on ${props.reference}`,
  'payment-instructions': (props) =>
    `Complete your registration — ${props.invoiceNumber}`,
  'payment-receipt': (props) =>
    `Registration confirmed — ${props.invoiceNumber}`,
};

export function renderTemplate<K extends TemplateKey>(
  template: K,
  props: TemplateProps[K],
): ReactElement {
  return renderers[template](props);
}

export function isTemplateKey(value: string): value is TemplateKey {
  return value in renderers;
}
