import { Button, Section, Text } from '@react-email/components';

import { EmailLayout, styles } from './layout';

export interface SubmissionDecisionEmailProps {
  conferenceName: string;
  authorName: string;
  reference: string;
  title: string;
  decision: 'accepted' | 'rejected' | 'revision_requested';
  decisionNote?: string | null;
  reviewerComments?: string[];
  cameraReadyDeadline?: string | null;
  actionUrl: string;
}

const HEADINGS = {
  accepted: 'Your paper has been accepted',
  rejected: 'Decision on your submission',
  revision_requested: 'Revisions requested for your submission',
} as const;

export function SubmissionDecisionEmail({
  conferenceName,
  authorName,
  reference,
  title,
  decision,
  decisionNote,
  reviewerComments = [],
  cameraReadyDeadline,
  actionUrl,
}: SubmissionDecisionEmailProps) {
  return (
    <EmailLayout preview={HEADINGS[decision]} conferenceName={conferenceName}>
      <Text style={styles.heading}>{HEADINGS[decision]}</Text>
      <Text style={styles.paragraph}>
        Dear {authorName}, the programme committee has completed its review of{' '}
        <strong>{reference}</strong> — &ldquo;{title}&rdquo;.
      </Text>

      {decision === 'accepted' ? (
        <Text style={styles.paragraph}>
          We are pleased to inform you that your submission has been{' '}
          <strong>accepted</strong> for presentation at {conferenceName}. To
          appear in the programme you must complete registration and payment,
          and upload the camera-ready version
          {cameraReadyDeadline ? ` by ${cameraReadyDeadline}` : ''}.
        </Text>
      ) : null}

      {decision === 'revision_requested' ? (
        <Text style={styles.paragraph}>
          The committee asks for revisions before a final decision can be made.
          Please address the comments below and upload a revised manuscript
          {cameraReadyDeadline ? ` by ${cameraReadyDeadline}` : ''}.
        </Text>
      ) : null}

      {decision === 'rejected' ? (
        <Text style={styles.paragraph}>
          After careful consideration the committee is unable to accept this
          submission. Competition was strong this year and we hope the reviewer
          comments are useful for future work.
        </Text>
      ) : null}

      {decisionNote ? (
        <Section style={styles.meta}>
          <Text style={{ margin: 0 }}>
            <strong>Note from the committee</strong>
            <br />
            {decisionNote}
          </Text>
        </Section>
      ) : null}

      {reviewerComments.length > 0 ? (
        <Section style={{ ...styles.meta, marginTop: '12px' }}>
          <Text style={{ margin: 0 }}>
            <strong>Reviewer comments</strong>
          </Text>
          {reviewerComments.map((comment, index) => (
            <Text key={index} style={{ margin: '8px 0 0' }}>
              <strong>Reviewer {index + 1}:</strong> {comment}
            </Text>
          ))}
        </Section>
      ) : null}

      <Button href={actionUrl} style={{ ...styles.button, marginTop: '16px' }}>
        {decision === 'accepted' ? 'Register and pay' : 'View submission'}
      </Button>
    </EmailLayout>
  );
}

export default SubmissionDecisionEmail;
