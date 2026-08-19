import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const ALLOWED_MANUSCRIPT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const MAX_MANUSCRIPT_BYTES = 25 * 1024 * 1024;

/**
 * Quotes end the filename token and control characters can split a header, so
 * both are dropped before the name is echoed back in Content-Disposition.
 */
function sanitizeFileName(fileName: string) {
  // eslint-disable-next-line no-control-regex
  return fileName.replace(/["\\]/g, '').replace(/[\u0000-\u001f\u007f]/g, '');
}

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('S3_ENDPOINT') || undefined;

    this.s3 = new S3Client({
      region: this.configService.get('S3_REGION', 'auto'),
      endpoint,
      forcePathStyle: Boolean(endpoint),
      credentials: {
        accessKeyId: this.configService.getOrThrow('S3_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow('S3_SECRET_ACCESS_KEY'),
      },
    });
    this.bucket = this.configService.getOrThrow('S3_BUCKET');
  }

  /**
   * Signing ContentType and ContentLength puts both in X-Amz-SignedHeaders, so
   * S3 rejects the PUT unless the client sends exactly these values. Without
   * the length the URL is a licence to upload an object of any size at our
   * expense -- the 25 MB check on the request side would be advisory, since it
   * only ever saw a number the client typed.
   */
  createUploadUrl(
    key: string,
    contentType: string,
    contentLength: number,
    expiresIn = 300,
  ) {
    return getSignedUrl(
      this.s3,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
        ContentLength: contentLength,
      }),
      {
        expiresIn,
        signableHeaders: new Set(['content-type', 'content-length']),
      },
    );
  }

  /**
   * What is actually in the bucket, as opposed to what the client claims it
   * put there. Returns null when the key does not exist.
   */
  async statObject(key: string) {
    try {
      const head = await this.s3.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return {
        sizeBytes: head.ContentLength ?? 0,
        contentType: head.ContentType ?? '',
      };
    } catch (cause) {
      const status = (cause as { $metadata?: { httpStatusCode?: number } })
        .$metadata?.httpStatusCode;
      if (status === 404 || status === 403) return null;
      throw cause;
    }
  }

  createDownloadUrl(key: string, fileName?: string, expiresIn = 300) {
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ResponseContentDisposition: fileName
          ? `attachment; filename="${sanitizeFileName(fileName)}"`
          : undefined,
      }),
      { expiresIn },
    );
  }

  async deleteObject(key: string) {
    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  buildSubmissionFileKey(args: {
    conferenceSlug: string;
    submissionId: number;
    kind: string;
    version: number;
    fileName: string;
  }) {
    const safeName = args.fileName
      .normalize('NFKD')
      .replace(/[^\w.-]+/g, '_')
      .slice(-120);
    return `${args.conferenceSlug}/submissions/${args.submissionId}/${args.kind}-v${args.version}-${safeName}`;
  }
}
