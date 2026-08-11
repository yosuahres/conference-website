"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@shared/ui/components/ui/button";
import { Input } from "@shared/ui/components/ui/input";
import { Label } from "@shared/ui/components/ui/label";
import { profileSchema } from "@/lib/validation/registration";
import { updateProfile } from "@/server/users/actions";

type ProfileInput = z.infer<typeof profileSchema>;

export function ProfileForm({
  defaultValues,
  email,
}: {
  defaultValues: ProfileInput;
  email: string;
}) {
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  return (
    <form
      onSubmit={form.handleSubmit(async (values) => {
        const result = await updateProfile(values);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success("Profile updated.");
      })}
      className="space-y-6 rounded-lg border bg-card p-6"
    >
      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={email} disabled />
        <p className="text-xs text-muted-foreground">
          Contact the committee to change your email address.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" {...form.register("name")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Academic title</Label>
          <Input
            id="title"
            placeholder="Dr., Prof., …"
            {...form.register("title")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="affiliation">Affiliation</Label>
          <Input id="affiliation" {...form.register("affiliation")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" {...form.register("country")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...form.register("phone")} />
        </div>
      </div>

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
