import type { ReactElement } from "react";

import { MagicLinkEmail, type MagicLinkEmailProps } from "./magic-link";
import {
  PaymentInstructionsEmail,
  type PaymentInstructionsEmailProps,
} from "./payment-instructions";
import {
  PaymentReceiptEmail,
  type PaymentReceiptEmailProps,
} from "./payment-receipt";
import {
  SubmissionDecisionEmail,
  type SubmissionDecisionEmailProps,
} from "./submission-decision";
import {
  SubmissionReceivedEmail,
  type SubmissionReceivedEmailProps,
} from "./submission-received";

/**
 * Every template is addressable by a stable string key. `email_log` stores that
 * key plus the props, which is what makes a retry possible hours later without
 * reconstructing the original call site.
 */
export interface TemplateProps {
  "magic-link": MagicLinkEmailProps;
  "submission-received": SubmissionReceivedEmailProps;
  "submission-decision": SubmissionDecisionEmailProps;
  "payment-instructions": PaymentInstructionsEmailProps;
  "payment-receipt": PaymentReceiptEmailProps;
}

export type TemplateKey = keyof TemplateProps;

const renderers: {
  [K in TemplateKey]: (props: TemplateProps[K]) => ReactElement;
} = {
  "magic-link": MagicLinkEmail,
  "submission-received": SubmissionReceivedEmail,
  "submission-decision": SubmissionDecisionEmail,
  "payment-instructions": PaymentInstructionsEmail,
  "payment-receipt": PaymentReceiptEmail,
};

export function renderTemplate<K extends TemplateKey>(
  template: K,
  props: TemplateProps[K],
): ReactElement {
  const Component = renderers[template];
  return Component(props);
}

export function isTemplateKey(value: string): value is TemplateKey {
  return value in renderers;
}
