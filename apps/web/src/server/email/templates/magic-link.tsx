import { Button, Text } from "@react-email/components";

import { EmailLayout, styles } from "./layout";

export interface MagicLinkEmailProps {
  conferenceName: string;
  name?: string;
  url: string;
  purpose: "verify" | "sign-in";
}

export function MagicLinkEmail({
  conferenceName,
  name,
  url,
  purpose,
}: MagicLinkEmailProps) {
  const heading =
    purpose === "verify" ? "Confirm your email" : "Your sign-in link";

  return (
    <EmailLayout preview={heading} conferenceName={conferenceName}>
      <Text style={styles.heading}>{heading}</Text>
      <Text style={styles.paragraph}>
        {name ? `Hello ${name},` : "Hello,"} use the button below to
        {purpose === "verify"
          ? " confirm your email address and activate your account."
          : " sign in. No password needed."}
      </Text>
      <Button href={url} style={styles.button}>
        {purpose === "verify" ? "Confirm email" : "Sign in"}
      </Button>
      <Text style={{ ...styles.paragraph, marginTop: "16px" }}>
        This link expires in one hour and can only be used once. If you did not
        request it, you can ignore this message.
      </Text>
    </EmailLayout>
  );
}

export default MagicLinkEmail;
