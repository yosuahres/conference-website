"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@shared/ui/components/ui/button";
import { ApiError, api } from "@/lib/api";

export function DownloadButton({
  fileId,
  label,
}: {
  fileId: number;
  label: string;
}) {
  const [pending, setPending] = useState(false);

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          const { url } = await api.submissions.downloadUrl(fileId);
          window.open(url, "_blank", "noopener,noreferrer");
        } catch (cause) {
          toast.error(
            cause instanceof ApiError ? cause.message : "Download failed.",
          );
        } finally {
          setPending(false);
        }
      }}
    >
      <Download className="mr-2 size-4" />
      {label}
    </Button>
  );
}
