import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db, schema } from "@/server/db";
import { env } from "@/server/env";
import { sendMagicLinkEmail } from "@/server/email/send";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),

  /**
   * Password sign-in only exists so committee accounts can be seeded. Authors
   * and attendees use the magic link below — they visit the site a handful of
   * times a year and will not remember a password.
   */
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
  },

  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "attendee", input: false },
      title: { type: "string", required: false },
      affiliation: { type: "string", required: false },
      country: { type: "string", required: false },
      phone: { type: "string", required: false },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    // Deliberately off. The cookie cache would embed `role` in the cookie, so
    // granting or revoking admin would not take effect for another five
    // minutes — a demoted admin keeps acting as one. One session read per
    // request is nothing at conference traffic.
    cookieCache: { enabled: false },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendMagicLinkEmail({
        to: user.email,
        name: user.name,
        url,
        purpose: "verify",
      });
    },
  },

  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
