import { Button, Section, Text } from '@react-email/components';

import { EmailLayout, styles } from './layout';

export interface PaymentInstructionsEmailProps {
  conferenceName: string;
  attendeeName: string;
  invoiceNumber: string;
  tierName: string;
  amountFormatted: string;
  expiresAt?: string | null;
  payUrl: string;
}

/** Sent the moment a registration is created, before any money moves. */
export function PaymentInstructionsEmail({
  conferenceName,
  attendeeName,
  invoiceNumber,
  tierName,
  amountFormatted,
  expiresAt,
  payUrl,
}: PaymentInstructionsEmailProps) {
  return (
    <EmailLayout
      preview={`Complete your payment — ${invoiceNumber}`}
      conferenceName={conferenceName}
    >
      <Text style={styles.heading}>Complete your registration</Text>
      <Text style={styles.paragraph}>
        Dear {attendeeName}, your registration for {conferenceName} is reserved
        but not yet confirmed. Complete the payment below to secure your place.
      </Text>
      <Section style={styles.meta}>
        <Text style={{ margin: 0 }}>
          <strong>Invoice:</strong> {invoiceNumber}
          <br />
          <strong>Category:</strong> {tierName}
          <br />
          <strong>Amount due:</strong> {amountFormatted}
          {expiresAt ? (
            <>
              <br />
              <strong>Pay before:</strong> {expiresAt}
            </>
          ) : null}
        </Text>
      </Section>
      <Button href={payUrl} style={{ ...styles.button, marginTop: '16px' }}>
        Pay now
      </Button>
      <Text style={{ ...styles.paragraph, marginTop: '16px' }}>
        Bank transfer, virtual account, QRIS and card payments are all accepted.
        Confirmation is automatic once the payment clears.
      </Text>
    </EmailLayout>
  );
}

export default PaymentInstructionsEmail;
