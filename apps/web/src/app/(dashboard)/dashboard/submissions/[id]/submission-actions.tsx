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
import { ApiError, api } from "@/lib/api";

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

  async function run(action: () => Promise<unknown>, success: string) {
    setPending(true);
    try {
      await action();
      toast.success(success);
      router.refresh();
    } catch (cause) {
      toast.error(
        cause instanceof ApiError ? cause.message : "Something went wrong.",
      );
    } finally {
      setPending(false);
    }
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
                  run(
                    () => api.submissions.submit(submissionId),
                    "Submitted. Check your email.",
                  )
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
                  run(
                    () => api.submissions.withdraw(submissionId),
                    "Submission withdrawn.",
                  )
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
