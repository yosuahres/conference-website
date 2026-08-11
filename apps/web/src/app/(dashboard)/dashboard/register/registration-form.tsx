"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@shared/ui/components/ui/button";
import { Checkbox } from "@shared/ui/components/ui/checkbox";
import { Input } from "@shared/ui/components/ui/input";
import { Label } from "@shared/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/components/ui/select";
import { Textarea } from "@shared/ui/components/ui/textarea";
import { formatIdr } from "@/lib/format";
import {
  registrationSchema,
  type RegistrationInput,
} from "@/lib/validation/registration";
import { createRegistration } from "@/server/registrations/actions";

interface Tier {
  id: number;
  name: string;
  category: string;
  mode: "onsite" | "online";
  price: number;
  description: string | null;
}

interface RegistrationFormProps {
  tiers: Tier[];
  acceptedPapers: { id: number; reference: string; title: string }[];
  defaultTierId?: number;
  user: {
    name: string;
    affiliation?: string | null;
    country?: string | null;
    phone?: string | null;
  };
}

const PRESENTER_CATEGORIES = ["presenter", "student_presenter"];

export function RegistrationForm({
  tiers,
  acceptedPapers,
  defaultTierId,
  user,
}: RegistrationFormProps) {
  const [redirecting, setRedirecting] = useState(false);

  const form = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      tierId: defaultTierId ?? tiers[0]?.id,
      submissionId: acceptedPapers[0]?.id ?? null,
      mode: "onsite",
      fullName: user.name,
      affiliation: user.affiliation ?? "",
      country: user.country ?? "",
      phone: user.phone ?? "",
      dietaryNotes: "",
      needsVisaLetter: false,
    },
  });

  const selectedTier = tiers.find(
    (tier) => tier.id === Number(form.watch("tierId")),
  );
  const needsPaper =
    selectedTier !== undefined &&
    PRESENTER_CATEGORIES.includes(selectedTier.category);

  async function onSubmit(values: RegistrationInput) {
    const result = await createRegistration({
      ...values,
      // Only presenters carry a paper; sending one otherwise is noise.
      submissionId: needsPaper ? values.submissionId : null,
    });

    if (!result.ok) {
      toast.error(result.error);
      for (const [field, messages] of Object.entries(
        result.fieldErrors ?? {},
      )) {
        form.setError(field as keyof RegistrationInput, {
          message: messages[0],
        });
      }
      return;
    }

    setRedirecting(true);
    // Hand off to Midtrans' hosted payment page.
    window.location.href = result.data.redirectUrl;
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <section className="space-y-4 rounded-lg border bg-card p-6">
        <h2 className="text-base font-semibold">Registration category</h2>

        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={String(form.watch("tierId") ?? "")}
            onValueChange={(value) => form.setValue("tierId", Number(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {tiers.map((tier) => (
                <SelectItem key={tier.id} value={String(tier.id)}>
                  {tier.name} — {formatIdr(tier.price)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTier?.description ? (
            <p className="text-xs text-muted-foreground">
              {selectedTier.description}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label>Attendance</Label>
          <Select
            value={form.watch("mode")}
            onValueChange={(value) =>
              form.setValue("mode", value as "onsite" | "online")
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="onsite">On-site</SelectItem>
              <SelectItem value="online">Online</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {needsPaper ? (
          <div className="space-y-2">
            <Label>Accepted paper</Label>
            {acceptedPapers.length === 0 ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-900 dark:bg-amber-950/40">
                No accepted paper is linked to your account. Choose a
                participant category instead, or contact the committee.
              </p>
            ) : (
              <Select
                value={String(form.watch("submissionId") ?? "")}
                onValueChange={(value) =>
                  form.setValue("submissionId", Number(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your paper" />
                </SelectTrigger>
                <SelectContent>
                  {acceptedPapers.map((paper) => (
                    <SelectItem key={paper.id} value={String(paper.id)}>
                      {paper.reference} — {paper.title.slice(0, 60)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ) : null}
      </section>

      <section className="space-y-4 rounded-lg border bg-card p-6">
        <h2 className="text-base font-semibold">Attendee details</h2>
        <p className="text-xs text-muted-foreground">
          These details are printed on your badge and certificate.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name (with title)</Label>
            <Input id="fullName" {...form.register("fullName")} />
            <FieldError message={form.formState.errors.fullName?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone / WhatsApp</Label>
            <Input id="phone" {...form.register("phone")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="affiliation">Affiliation</Label>
            <Input id="affiliation" {...form.register("affiliation")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" {...form.register("country")} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dietaryNotes">Dietary requirements (optional)</Label>
          <Textarea
            id="dietaryNotes"
            rows={3}
            {...form.register("dietaryNotes")}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={form.watch("needsVisaLetter")}
            onCheckedChange={(checked) =>
              form.setValue("needsVisaLetter", checked === true)
            }
          />
          I need an invitation letter for a visa application
        </label>
      </section>

      {selectedTier ? (
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-6">
          <div>
            <p className="text-sm text-muted-foreground">Total due</p>
            <p className="text-2xl font-bold">
              {formatIdr(selectedTier.price)}
            </p>
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={
              form.formState.isSubmitting ||
              redirecting ||
              (needsPaper && acceptedPapers.length === 0)
            }
          >
            {redirecting
              ? "Redirecting to payment…"
              : form.formState.isSubmitting
                ? "Creating…"
                : "Continue to payment"}
          </Button>
        </div>
      ) : null}
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}
