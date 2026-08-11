"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@shared/ui/components/ui/button";
import {
  cancelRegistration,
  retryPayment,
} from "@/server/registrations/actions";

export function PaymentActions({ registrationId }: { registrationId: number }) {
  const router = useRouter();
  const [pending, setPending] = useState<"pay" | "cancel" | null>(null);

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        disabled={pending !== null}
        onClick={async () => {
          setPending("pay");
          const result = await retryPayment(registrationId);
          if (!result.ok) {
            setPending(null);
            toast.error(result.error);
            return;
          }
          window.location.href = result.data.redirectUrl;
        }}
      >
        {pending === "pay" ? "Opening payment…" : "Pay now"}
      </Button>

      <Button
        variant="ghost"
        disabled={pending !== null}
        onClick={async () => {
          setPending("cancel");
          const result = await cancelRegistration(registrationId);
          setPending(null);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success("Registration cancelled.");
          router.push("/dashboard");
          router.refresh();
        }}
      >
        Cancel registration
      </Button>
    </div>
  );
}
