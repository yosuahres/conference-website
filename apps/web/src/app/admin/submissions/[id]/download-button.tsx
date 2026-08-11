"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@shared/ui/components/ui/button";
import { getFileDownloadUrl } from "@/server/admin/actions";

/**
 * Manuscripts are private in the bucket, so the URL is minted on click and
 * expires in minutes — a copied link is not a permanent leak.
 */
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
        const result = await getFileDownloadUrl(fileId);
        setPending(false);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        window.open(result.data.url, "_blank", "noopener,noreferrer");
      }}
    >
      <Download className="mr-2 size-4" />
      {label}
    </Button>
  );
}
