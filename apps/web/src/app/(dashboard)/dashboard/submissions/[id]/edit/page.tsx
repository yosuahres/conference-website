import { notFound, redirect } from "next/navigation";

import { ApiError, api } from "@/lib/api";
import { forwardedCookies, requireUser } from "@/lib/server-api";
import { isEditableByAuthor } from "@/lib/submission-status";
import { SubmissionForm } from "../../submission-form";

export const metadata = { title: "Edit submission" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSubmissionPage({ params }: PageProps) {
  await requireUser();
  const { id } = await params;

  const detail = await api.submissions
    .get(Number(id), await forwardedCookies())
    .catch((cause) => {
      if (cause instanceof ApiError && cause.status === 404) return null;
      throw cause;
    });
  if (!detail) notFound();

  if (!isEditableByAuthor(detail.submission.status)) {
    redirect(`/dashboard/submissions/${id}`);
  }

  const tracks = await api.conference.tracks();

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
