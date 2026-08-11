import Link from "next/link";

import { Button } from "@shared/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/components/ui/card";
import { ApiError, api } from "@/lib/api";

export const metadata = { title: "Confirm your email" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  let outcome: "ok" | "invalid" | "missing" = "missing";
  if (token) {
    try {
      await api.auth.verifyEmail(token);
      outcome = "ok";
    } catch (cause) {
      if (cause instanceof ApiError) outcome = "invalid";
      else throw cause;
    }
  }

  const copy = {
    ok: {
      title: "Email confirmed",
      body: "Your address is verified. You can now submit papers and register.",
    },
    invalid: {
      title: "That link didn't work",
      body: "It may have expired or already been used. Sign in and request a new confirmation email.",
    },
    missing: {
      title: "Nothing to confirm",
      body: "This page needs a confirmation link from your email.",
    },
  }[outcome];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.body}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full">
          <Link href={outcome === "ok" ? "/dashboard" : "/sign-in"}>
            {outcome === "ok" ? "Go to dashboard" : "Sign in"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
