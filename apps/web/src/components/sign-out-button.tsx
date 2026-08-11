"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@shared/ui/components/ui/button";
import { api } from "@/lib/api";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        // The API clears the cookies; ignore failures so a stale session can
        // still be walked away from.
        await api.auth.logout().catch(() => undefined);
        router.push("/");
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
