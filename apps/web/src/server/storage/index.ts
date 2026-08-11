import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "@/server/env";

/**
 * Any S3-compatible bucket: AWS, Cloudflare R2, Supabase Storage, MinIO.
 * `forcePathStyle` keeps R2 and MinIO happy; AWS tolerates it.
 */
const s3 = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT,
  forcePathStyle: Boolean(env.S3_ENDPOINT),
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
});

export const ALLOWED_MANUSCRIPT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const MAX_MANUSCRIPT_BYTES = 25 * 1024 * 1024;

/**
 * Manuscripts never touch the Next.js server — the browser PUTs straight to the
 * bucket with a short-lived URL. Keeps us clear of serverless body limits and
 * of holding a 25 MB PDF in memory.
 */
export async function createUploadUrl({
  key,
  contentType,
  expiresIn = 300,
}: {
  key: string;
  contentType: string;
  expiresIn?: number;
}) {
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

/**
 * Downloads are signed per request too — manuscripts under review must not be
 * publicly readable by URL guessing.
 */
export async function createDownloadUrl({
  key,
  fileName,
  expiresIn = 300,
}: {
  key: string;
  fileName?: string;
  expiresIn?: number;
}) {
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ResponseContentDisposition: fileName
      ? `attachment; filename="${fileName.replace(/"/g, "")}"`
      : undefined,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

export async function deleteObject(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
}

/**
 * Keys are namespaced by conference and submission so a bucket listing is
 * readable and a whole edition can be archived with one prefix copy.
 */
export function buildSubmissionFileKey({
  conferenceSlug,
  submissionId,
  kind,
  version,
  fileName,
}: {
  conferenceSlug: string;
  submissionId: number;
  kind: string;
  version: number;
  fileName: string;
}) {
  const safeName = fileName
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "_")
    .slice(-120);
  return `${conferenceSlug}/submissions/${submissionId}/${kind}-v${version}-${safeName}`;
}
