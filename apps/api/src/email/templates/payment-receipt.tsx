import { Button, Section, Text } from '@react-email/components';

import { EmailLayout, styles } from './layout';

export interface PaymentReceiptEmailProps {
  conferenceName: string;
  attendeeName: string;
  invoiceNumber: string;
  tierName: string;
  amountFormatted: string;
  method?: string | null;
  paidAt: string;
  conferenceDates?: string | null;
  venue?: string | null;
  dashboardUrl: string;
}

export function PaymentReceiptEmail({
  conferenceName,
  attendeeName,
  invoiceNumber,
  tierName,
  amountFormatted,
  method,
  paidAt,
  conferenceDates,
  venue,
  dashboardUrl,
}: PaymentReceiptEmailProps) {
  return (
    <EmailLayout
      preview={`Registration confirmed — ${invoiceNumber}`}
      conferenceName={conferenceName}
    >
      <Text style={styles.heading}>Registration confirmed</Text>
      <Text style={styles.paragraph}>
        Dear {attendeeName}, we have received your payment. Your place at{' '}
        {conferenceName} is confirmed. This email is your receipt.
      </Text>
      <Section style={styles.meta}>
        <Text style={{ margin: 0 }}>
          <strong>Invoice:</strong> {invoiceNumber}
          <br />
          <strong>Category:</strong> {tierName}
          <br />
          <strong>Amount paid:</strong> {amountFormatted}
          {method ? (
            <>
              <br />
              <strong>Method:</strong> {method}
            </>
          ) : null}
          <br />
          <strong>Paid on:</strong> {paidAt}
        </Text>
      </Section>
      {conferenceDates || venue ? (
        <Section style={{ ...styles.meta, marginTop: '12px' }}>
          <Text style={{ margin: 0 }}>
            {conferenceDates ? (
              <>
                <strong>Dates:</strong> {conferenceDates}
                <br />
              </>
            ) : null}
            {venue ? (
              <>
                <strong>Venue:</strong> {venue}
              </>
            ) : null}
          </Text>
        </Section>
      ) : null}
      <Button
        href={dashboardUrl}
        style={{ ...styles.button, marginTop: '16px' }}
      >
        View registration
      </Button>
    </EmailLayout>
  );
}

export default PaymentReceiptEmail;
