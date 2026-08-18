import {
  DeleteObjectCommand,
  GetObjectCommand,
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

  createUploadUrl(key: string, contentType: string, expiresIn = 300) {
    return getSignedUrl(
      this.s3,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn },
    );
  }

  createDownloadUrl(key: string, fileName?: string, expiresIn = 300) {
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ResponseContentDisposition: fileName
          ? `attachment; filename="${fileName.replace(/"/g, '')}"`
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
