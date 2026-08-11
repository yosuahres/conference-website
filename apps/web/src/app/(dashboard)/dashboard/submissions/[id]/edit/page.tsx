import { notFound, redirect } from "next/navigation";

import { requireUser } from "@/server/auth/session";
import {
  getTracks,
  requireActiveConference,
} from "@/server/conference/queries";
import { getSubmissionDetail } from "@/server/submissions/queries";
import { isEditableByAuthor } from "@/server/submissions/state";
import { SubmissionForm } from "../../submission-form";

export const metadata = { title: "Edit submission" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSubmissionPage({ params }: PageProps) {
  const user = await requireUser();
  const conference = await requireActiveConference();

  const { id } = await params;
  const detail = await getSubmissionDetail(Number(id), user.id);
  if (!detail) notFound();

  if (!isEditableByAuthor(detail.submission.status)) {
    redirect(`/dashboard/submissions/${id}`);
  }

  const tracks = await getTracks(conference.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Edit submission</h1>
      <SubmissionForm
        tracks={tracks}
        submissionId={detail.submission.id}
        defaultValues={{
          title: detail.submission.title,
          abstract: detail.submission.abstract,
          keywords: detail.submission.keywords,
          type: detail.submission.type,
          trackId: detail.submission.trackId,
          authors: detail.authors.map((author) => ({
            name: author.name,
            email: author.email,
            affiliation: author.affiliation ?? "",
            country: author.country ?? "",
            isCorresponding: author.isCorresponding === 1,
          })),
        }}
      />
    </div>
  );
}
