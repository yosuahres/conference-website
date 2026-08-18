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
        await api.auth.logout().catch(() => undefined);
        router.push("/");
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
