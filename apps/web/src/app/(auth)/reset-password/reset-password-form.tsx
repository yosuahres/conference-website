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

export function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [pending, setPending] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set a new password</CardTitle>
        <CardDescription>
          {token
            ? "Choose a password of at least 10 characters."
            : "This page needs a reset link from your email."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const password = String(
              new FormData(event.currentTarget).get("password"),
            );
            setPending(true);
            try {
              await api.auth.resetPassword(token, password);
              toast.success(
                "Password updated. Sign in with your new password.",
              );
              router.push("/sign-in");
            } catch (cause) {
              toast.error(
                cause instanceof ApiError ? cause.message : "Reset failed.",
              );
            } finally {
              setPending(false);
            }
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={10}
              autoComplete="new-password"
              disabled={!token}
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending || !token}>
            {pending ? "Saving…" : "Update password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
