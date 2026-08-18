"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import type { SubmissionFileKind } from "@shared/types";
import { Button } from "@shared/ui/components/ui/button";
import { ApiError, api } from "@/lib/api";

interface FileUploadProps {
  submissionId: number;
  kind: SubmissionFileKind;
  label: string;
  accept?: string;
}

export function FileUpload({
  submissionId,
  kind,
  label,
  accept = ".pdf,.doc,.docx",
}: FileUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);

  async function handleFile(file: File) {
    setProgress(0);

    try {
      const ticket = await api.submissions.requestUpload(submissionId, {
        kind,
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      });

      await putWithProgress(ticket.uploadUrl, file, setProgress);

      await api.submissions.confirmUpload(submissionId, {
        kind,
        storageKey: ticket.storageKey,
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        version: ticket.version,
      });

      toast.success(`${label} uploaded.`);
      router.refresh();
    } catch (cause) {
      toast.error(
        cause instanceof ApiError ? cause.message : "Upload failed. Try again.",
      );
    } finally {
      setProgress(null);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={progress !== null}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mr-2 size-4" />
        {progress === null ? `Upload ${label}` : `Uploading… ${progress}%`}
      </Button>
    </div>
  );
}

function putWithProgress(
  url: string,
  file: File,
  onProgress: (percent: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed with status ${xhr.status}`));
    });
    xhr.addEventListener("error", () => reject(new Error("Network error")));

    xhr.send(file);
  });
}
