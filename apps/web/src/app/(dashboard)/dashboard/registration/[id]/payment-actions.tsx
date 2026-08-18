"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@shared/ui/components/ui/button";
import { ApiError, api } from "@/lib/api";

export function PaymentActions({ registrationId }: { registrationId: number }) {
  const router = useRouter();
  const [pending, setPending] = useState<"pay" | "cancel" | null>(null);

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        disabled={pending !== null}
        onClick={async () => {
          setPending("pay");
          try {
            const handoff =
              await api.registrations.retryPayment(registrationId);
            window.location.href = handoff.redirectUrl;
          } catch (cause) {
            setPending(null);
            toast.error(
              cause instanceof ApiError
                ? cause.message
                : "Could not open the payment page.",
            );
          }
        }}
      >
        {pending === "pay" ? "Opening payment…" : "Pay now"}
      </Button>

      <Button
        variant="ghost"
        disabled={pending !== null}
        onClick={async () => {
          setPending("cancel");
          try {
            await api.registrations.cancel(registrationId);
            toast.success("Registration cancelled.");
            router.push("/dashboard");
            router.refresh();
          } catch (cause) {
            toast.error(
              cause instanceof ApiError ? cause.message : "Cancel failed.",
            );
          } finally {
            setPending(null);
          }
        }}
      >
        Cancel registration
      </Button>
    </div>
  );
}
