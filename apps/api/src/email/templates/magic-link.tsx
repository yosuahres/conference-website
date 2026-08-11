import { Button, Text } from '@react-email/components';

import { EmailLayout, styles } from './layout';

export interface MagicLinkEmailProps {
  conferenceName: string;
  name?: string;
  url: string;
  purpose: 'verify' | 'sign-in' | 'reset';
}

const HEADINGS = {
  verify: 'Confirm your email',
  'sign-in': 'Your sign-in link',
  reset: 'Reset your password',
} as const;

const BODIES = {
  verify: ' confirm your email address and activate your account.',
  'sign-in': ' sign in. No password needed.',
  reset: ' choose a new password.',
} as const;

const ACTIONS = {
  verify: 'Confirm email',
  'sign-in': 'Sign in',
  reset: 'Reset password',
} as const;

export function MagicLinkEmail({
  conferenceName,
  name,
  url,
  purpose,
}: MagicLinkEmailProps) {
  return (
    <EmailLayout preview={HEADINGS[purpose]} conferenceName={conferenceName}>
      <Text style={styles.heading}>{HEADINGS[purpose]}</Text>
      <Text style={styles.paragraph}>
        {name ? `Hello ${name},` : 'Hello,'} use the button below to
        {BODIES[purpose]}
      </Text>
      <Button href={url} style={styles.button}>
        {ACTIONS[purpose]}
      </Button>
      <Text style={{ ...styles.paragraph, marginTop: '16px' }}>
        This link expires in {purpose === 'reset' ? 'one hour' : '24 hours'} and
        can only be used once. If you did not request it, you can ignore this
        message.
      </Text>
    </EmailLayout>
  );
}

export default MagicLinkEmail;
