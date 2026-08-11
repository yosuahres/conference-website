"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import type { UserRole } from "@shared/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/components/ui/select";
import { ApiError, api } from "@/lib/api";

export function RoleSelect({
  userId,
  role,
  disabled,
}: {
  userId: number;
  role: UserRole;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Select
      value={role}
      disabled={disabled || pending}
      onValueChange={async (value) => {
        setPending(true);
        try {
          await api.users.setRole(userId, value);
          toast.success("Role updated.");
          router.refresh();
        } catch (cause) {
          toast.error(
            cause instanceof ApiError ? cause.message : "Update failed.",
          );
        } finally {
          setPending(false);
        }
      }}
    >
      <SelectTrigger className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="attendee">Attendee</SelectItem>
        <SelectItem value="reviewer">Reviewer</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
      </SelectContent>
    </Select>
  );
}
