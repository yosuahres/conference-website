"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@shared/ui/components/ui/button";
import { confirmUpload, requestUploadUrl } from "@/server/submissions/actions";

type FileKind =
  | "manuscript"
  | "camera_ready"
  | "supplementary"
  | "copyright_form";

interface FileUploadProps {
  submissionId: number;
  kind: FileKind;
  label: string;
  accept?: string;
}

/**
 * Two-step upload: ask the server for a presigned PUT, send the bytes straight
 * to the bucket, then tell the server it landed. The file never passes through
 * a serverless function.
 */
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

    const prepared = await requestUploadUrl({
      submissionId,
      kind,
      fileName: file.name,
      contentType: file.type,
      sizeBytes: file.size,
    });

    if (!prepared.ok) {
      setProgress(null);
      toast.error(prepared.error);
      return;
    }

    try {
      await putWithProgress(prepared.data.uploadUrl, file, setProgress);
    } catch {
      setProgress(null);
      toast.error("Upload failed. Please try again.");
      return;
    }

    const confirmed = await confirmUpload({
      submissionId,
      kind,
      storageKey: prepared.data.storageKey,
      fileName: file.name,
      contentType: file.type,
      sizeBytes: file.size,
      version: prepared.data.version,
    });

    setProgress(null);

    if (!confirmed.ok) {
      toast.error(confirmed.error);
      return;
    }

    toast.success(`${label} uploaded.`);
    router.refresh();
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

/** `fetch` cannot report upload progress, so this one call stays on XHR. */
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
