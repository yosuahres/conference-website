"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@shared/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/components/ui/card";
import { Input } from "@shared/ui/components/ui/input";
import { Label } from "@shared/ui/components/ui/label";
import { ApiError, api } from "@/lib/api";

type Mode = "sign-in" | "sign-up";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [mode, setMode] = useState<Mode>("sign-in");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    setPending(true);
    try {
      if (mode === "sign-up") {
        await api.auth.register({
          email,
          password,
          name: String(form.get("name")),
          affiliation: String(form.get("affiliation") || "") || undefined,
        });
        toast.success(
          "Account created. Check your inbox to confirm your email.",
        );
      } else {
        await api.auth.login({ email, password });
      }

      // Registration signs you in too, so both paths land on the dashboard.
      router.push(next);
      router.refresh();
    } catch (cause) {
      toast.error(
        cause instanceof ApiError ? cause.message : "Something went wrong.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === "sign-in" ? "Sign in" : "Create an account"}
        </CardTitle>
        <CardDescription>
          {mode === "sign-in"
            ? "Access your submissions and registration."
            : "You need an account to submit a paper or register."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {mode === "sign-up" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" name="name" required autoComplete="name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="affiliation">Affiliation (optional)</Label>
                <Input
                  id="affiliation"
                  name="affiliation"
                  autoComplete="organization"
                />
              </div>
            </>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={10}
              autoComplete={
                mode === "sign-in" ? "current-password" : "new-password"
              }
            />
            {mode === "sign-up" ? (
              <p className="text-xs text-muted-foreground">
                At least 10 characters.
              </p>
            ) : null}
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending
              ? "Please wait…"
              : mode === "sign-in"
                ? "Sign in"
                : "Create account"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <a
            href="/forgot-password"
            className="text-xs text-muted-foreground underline underline-offset-4"
          >
            Forgot your password?
          </a>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "sign-in" ? "No account yet?" : "Already registered?"}{" "}
          <button
            type="button"
            className="font-medium text-foreground underline underline-offset-4"
            onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
          >
            {mode === "sign-in" ? "Create one" : "Sign in"}
          </button>
        </p>
      </CardContent>
    </Card>
  );
}
