import { redirect } from "next/navigation";

import { api } from "@/lib/api";
import { getActiveConference, requireUser } from "@/lib/server-api";
import { SubmissionForm } from "../submission-form";

export const metadata = { title: "New submission" };

export default async function NewSubmissionPage() {
  const user = await requireUser("/dashboard/submissions/new");
  const conference = await getActiveConference();

  if (!conference?.submissionOpen) redirect("/dashboard/submissions");

  const tracks = await api.conference.tracks();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          New submission
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Save a draft first, then upload your manuscript on the next screen.
          Nothing reaches the committee until you press Submit.
        </p>
      </div>

      <SubmissionForm
        tracks={tracks}
        currentUser={{
          name: user.name,
          email: user.email,
          affiliation: user.affiliation,
        }}
      />
    </div>
  );
}
