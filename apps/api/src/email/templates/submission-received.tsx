import { Button, Section, Text } from '@react-email/components';

import { EmailLayout, styles } from './layout';

export interface SubmissionReceivedEmailProps {
  conferenceName: string;
  authorName: string;
  reference: string;
  title: string;
  track?: string | null;
  submittedAt: string;
  notificationDate?: string | null;
  dashboardUrl: string;
}

export function SubmissionReceivedEmail({
  conferenceName,
  authorName,
  reference,
  title,
  track,
  submittedAt,
  notificationDate,
  dashboardUrl,
}: SubmissionReceivedEmailProps) {
  return (
    <EmailLayout
      preview={`Submission ${reference} received`}
      conferenceName={conferenceName}
    >
      <Text style={styles.heading}>We received your submission</Text>
      <Text style={styles.paragraph}>
        Dear {authorName}, thank you for submitting to {conferenceName}. Please
        keep the reference below — quote it in any correspondence with the
        committee.
      </Text>
      <Section style={styles.meta}>
        <Text style={{ margin: 0 }}>
          <strong>Reference:</strong> {reference}
          <br />
          <strong>Title:</strong> {title}
          {track ? (
            <>
              <br />
              <strong>Track:</strong> {track}
            </>
          ) : null}
          <br />
          <strong>Submitted:</strong> {submittedAt}
        </Text>
      </Section>
      {notificationDate ? (
        <Text style={{ ...styles.paragraph, marginTop: '16px' }}>
          Review outcomes are announced on {notificationDate}.
        </Text>
      ) : null}
      <Button href={dashboardUrl} style={styles.button}>
        View submission
      </Button>
    </EmailLayout>
  );
}

export default SubmissionReceivedEmail;
