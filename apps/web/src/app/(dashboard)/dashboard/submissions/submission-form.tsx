"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@shared/ui/components/ui/button";
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
import {
  submissionDraftSchema,
  type SubmissionDraftInput,
} from "@/lib/validation/submission";
import { ApiError, api } from "@/lib/api";

interface SubmissionFormProps {
  tracks: { id: number; name: string }[];
  submissionId?: number;
  defaultValues?: Partial<SubmissionDraftInput>;
  /** Prefills the first author row for a brand-new submission. */
  currentUser?: { name: string; email: string; affiliation?: string | null };
}

const TYPE_OPTIONS = [
  { value: "full_paper", label: "Full paper" },
  { value: "abstract", label: "Abstract only" },
  { value: "poster", label: "Poster" },
] as const;

export function SubmissionForm({
  tracks,
  submissionId,
  defaultValues,
  currentUser,
}: SubmissionFormProps) {
  const router = useRouter();
  const [keywordDraft, setKeywordDraft] = useState("");

  const form = useForm<SubmissionDraftInput>({
    resolver: zodResolver(submissionDraftSchema),
    defaultValues: {
      title: "",
      abstract: "",
      keywords: [],
      type: "full_paper",
      trackId: null,
      authors: currentUser
        ? [
            {
              name: currentUser.name,
              email: currentUser.email,
              affiliation: currentUser.affiliation ?? "",
              country: "",
              isCorresponding: true,
            },
          ]
        : [],
      ...defaultValues,
    },
  });

  const authors = useFieldArray({ control: form.control, name: "authors" });
  const keywords = form.watch("keywords");

  function addKeyword() {
    const value = keywordDraft.trim();
    if (!value) return;
    if (keywords.includes(value)) {
      setKeywordDraft("");
      return;
    }
    form.setValue("keywords", [...keywords, value], { shouldValidate: true });
    setKeywordDraft("");
  }

  async function onSubmit(values: SubmissionDraftInput) {
    // The API re-validates everything; zod here is only for fast feedback.
    const payload = { ...values, trackId: values.trackId ?? undefined };

    try {
      const result = submissionId
        ? await api.submissions.update(submissionId, payload)
        : await api.submissions.create(payload);

      toast.success("Draft saved.");
      router.push(`/dashboard/submissions/${result.id}`);
      router.refresh();
    } catch (cause) {
      if (!(cause instanceof ApiError)) throw cause;
      toast.error(cause.message);
      // Surface the API's field errors on the matching inputs.
      for (const [field, messages] of Object.entries(cause.fieldErrors ?? {})) {
        form.setError(field as keyof SubmissionDraftInput, {
          message: messages[0],
        });
      }
    }
  }

  const abstractLength = form.watch("abstract")?.length ?? 0;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <section className="space-y-4 rounded-lg border bg-card p-6">
        <h2 className="text-base font-semibold">Paper details</h2>

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...form.register("title")} />
          <FieldError message={form.formState.errors.title?.message} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Submission type</Label>
            <Select
              value={form.watch("type")}
              onValueChange={(value) =>
                form.setValue("type", value as SubmissionDraftInput["type"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Track</Label>
            <Select
              value={form.watch("trackId")?.toString() ?? ""}
              onValueChange={(value) =>
                form.setValue("trackId", value ? Number(value) : null)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a track" />
              </SelectTrigger>
              <SelectContent>
                {tracks.map((track) => (
                  <SelectItem key={track.id} value={String(track.id)}>
                    {track.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="abstract">Abstract</Label>
          <Textarea id="abstract" rows={10} {...form.register("abstract")} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <FieldError message={form.formState.errors.abstract?.message} />
            <span>{abstractLength} / 5000</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="keyword">Keywords</Label>
          <div className="flex gap-2">
            <Input
              id="keyword"
              value={keywordDraft}
              placeholder="Add a keyword and press Enter"
              onChange={(event) => setKeywordDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addKeyword();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addKeyword}>
              Add
            </Button>
          </div>
          {keywords.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {keywords.map((keyword) => (
                <button
                  key={keyword}
                  type="button"
                  className="rounded-full bg-muted px-3 py-1 text-xs hover:bg-destructive/10"
                  onClick={() =>
                    form.setValue(
                      "keywords",
                      keywords.filter((k) => k !== keyword),
                      { shouldValidate: true },
                    )
                  }
                >
                  {keyword} ×
                </button>
              ))}
            </div>
          ) : null}
          <FieldError message={form.formState.errors.keywords?.message} />
        </div>
      </section>

      <section className="space-y-4 rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Authors</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              authors.append({
                name: "",
                email: "",
                affiliation: "",
                country: "",
                isCorresponding: false,
              })
            }
          >
            <Plus className="mr-1 size-4" />
            Add author
          </Button>
        </div>

        <div className="space-y-4">
          {authors.fields.map((field, index) => (
            <div key={field.id} className="rounded-md border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Author {index + 1}</p>
                {authors.fields.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => authors.remove(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`authors.${index}.name`}>Name</Label>
                  <Input
                    id={`authors.${index}.name`}
                    {...form.register(`authors.${index}.name`)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`authors.${index}.email`}>Email</Label>
                  <Input
                    id={`authors.${index}.email`}
                    type="email"
                    {...form.register(`authors.${index}.email`)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`authors.${index}.affiliation`}>
                    Affiliation
                  </Label>
                  <Input
                    id={`authors.${index}.affiliation`}
                    {...form.register(`authors.${index}.affiliation`)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`authors.${index}.country`}>Country</Label>
                  <Input
                    id={`authors.${index}.country`}
                    {...form.register(`authors.${index}.country`)}
                  />
                </div>
              </div>

              <label className="mt-3 flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="corresponding"
                  checked={form.watch(`authors.${index}.isCorresponding`)}
                  onChange={() => {
                    // Exactly one corresponding author — selecting one clears
                    // the rest, which is what the schema validates.
                    authors.fields.forEach((_, i) =>
                      form.setValue(
                        `authors.${i}.isCorresponding`,
                        i === index,
                        { shouldValidate: true },
                      ),
                    );
                  }}
                />
                Corresponding author
              </label>
            </div>
          ))}
        </div>

        <FieldError message={form.formState.errors.authors?.message} />
      </section>

      <div className="flex gap-3">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving…" : "Save draft"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/dashboard/submissions")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}
