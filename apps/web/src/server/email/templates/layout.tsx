import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

interface EmailLayoutProps {
  preview: string;
  conferenceName: string;
  children: ReactNode;
  footerNote?: string;
}

/**
 * Inline styles only — Gmail strips <style> blocks, and this has to render in
 * Outlook for the reviewers who still use it.
 */
export function EmailLayout({
  preview,
  conferenceName,
  children,
  footerNote,
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section>
            <Text style={brand}>{conferenceName}</Text>
          </Section>
          <Hr style={hr} />
          {children}
          <Hr style={hr} />
          <Text style={footer}>
            {footerNote ??
              "You are receiving this because you have an account with " +
                `${conferenceName}.`}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#f6f7f9",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  padding: "24px 0",
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  margin: "0 auto",
  maxWidth: "560px",
  padding: "32px",
};

const brand = {
  color: "#0f172a",
  fontSize: "18px",
  fontWeight: 700,
  margin: 0,
};

const hr = { borderColor: "#e5e7eb", margin: "20px 0" };

const footer = { color: "#6b7280", fontSize: "12px", lineHeight: "18px" };

export const styles = {
  heading: {
    color: "#0f172a",
    fontSize: "20px",
    fontWeight: 600,
    margin: "0 0 12px",
  },
  paragraph: {
    color: "#334155",
    fontSize: "14px",
    lineHeight: "22px",
    margin: "0 0 12px",
  },
  button: {
    backgroundColor: "#0f172a",
    borderRadius: "6px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "14px",
    fontWeight: 600,
    padding: "12px 20px",
    textDecoration: "none",
  },
  meta: {
    backgroundColor: "#f8fafc",
    borderRadius: "6px",
    color: "#334155",
    fontSize: "13px",
    lineHeight: "20px",
    padding: "12px 16px",
  },
};
