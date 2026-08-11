"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@shared/ui/components/ui/button";
import { Checkbox } from "@shared/ui/components/ui/checkbox";
import { Label } from "@shared/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/components/ui/select";
import { Textarea } from "@shared/ui/components/ui/textarea";
import { recordDecision } from "@/server/admin/actions";

type Decision = "accepted" | "rejected" | "revision_requested";

/**
 * Recording a decision sends the author an email immediately — there is no
 * separate "notify" step, so the confirmation copy says so plainly.
 */
export function DecisionForm({ submissionId }: { submissionId: number }) {
  const router = useRouter();
  const [decision, setDecision] = useState<Decision>("accepted");
  const [note, setNote] = useState("");
  const [shareComments, setShareComments] = useState(true);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        const result = await recordDecision({
          submissionId,
          decision,
          note,
          shareReviewerComments: shareComments,
        });
        setPending(false);

        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success("Decision recorded and the author has been emailed.");
        router.refresh();
      }}
    >
      <div className="space-y-2">
        <Label>Decision</Label>
        <Select
          value={decision}
          onValueChange={(value) => setDecision(value as Decision)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="accepted">Accept</SelectItem>
            <SelectItem value="revision_requested">
              Request revisions
            </SelectItem>
            <SelectItem value="rejected">Reject</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Note to the author (optional)</Label>
        <Textarea
          id="note"
          rows={4}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Included verbatim in the notification email."
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={shareComments}
          onCheckedChange={(checked) => setShareComments(checked === true)}
        />
        Include reviewer comments in the email
      </label>

      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Record decision and notify author"}
      </Button>
    </form>
  );
}
