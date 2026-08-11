"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@shared/ui/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@shared/ui/components/ui/alert-dialog";
import {
  submitForReview,
  withdrawSubmission,
} from "@/server/submissions/actions";

interface SubmissionActionsProps {
  submissionId: number;
  canSubmit: boolean;
  canWithdraw: boolean;
  hasManuscript: boolean;
}

export function SubmissionActions({
  submissionId,
  canSubmit,
  canWithdraw,
  hasManuscript,
}: SubmissionActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setPending(true);
    const result = await fn();
    setPending(false);
    if (!result.ok) {
      toast.error(result.error ?? "Something went wrong.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-3">
      {canSubmit ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={pending || !hasManuscript}>
              Submit for review
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Submit for review?</AlertDialogTitle>
              <AlertDialogDescription>
                Once submitted, the paper is locked and you will not be able to
                edit it unless the committee requests revisions.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  run(async () => {
                    const result = await submitForReview(submissionId);
                    if (result.ok)
                      toast.success("Submitted. Check your email.");
                    return result;
                  })
                }
              >
                Submit
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}

      {canSubmit && !hasManuscript ? (
        <p className="self-center text-xs text-muted-foreground">
          Upload a manuscript to enable submission.
        </p>
      ) : null}

      {canWithdraw ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" disabled={pending}>
              Withdraw
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Withdraw this submission?</AlertDialogTitle>
              <AlertDialogDescription>
                This cannot be undone. The committee will no longer consider the
                paper.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  run(async () => {
                    const result = await withdrawSubmission(submissionId);
                    if (result.ok) toast.success("Submission withdrawn.");
                    return result;
                  })
                }
              >
                Withdraw
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  );
}
