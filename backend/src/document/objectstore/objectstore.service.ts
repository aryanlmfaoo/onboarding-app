import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ObjectstoreService {
  private s3Client: S3Client;
  private bucketName: string;
  private readonly logger = new Logger(ObjectstoreService.name);

  constructor(private readonly configService: ConfigService) {
    // s3ClientSetup
    this.s3Client = new S3Client({
      endpoint: this.configService.getOrThrow('AWS_BUCKET_ENDPOINT'),
      region: this.configService.getOrThrow('AWS_BUCKET_REGION'),
      forcePathStyle: true,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      credentials: {
        accessKeyId: this.configService.getOrThrow('AWS_BUCKET_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow(
          'AWS_BUCKET_SECRET_ACCESS_KEY',
        ),
      },
    });
    // Bucket name Injection
    this.bucketName = this.configService.getOrThrow('AWS_DOCUMENT_BUCKET_NAME');
  }

  async uploadDocumentUrl(s3Key: string, mimeType: string) {
    this.logger.log(`Creating document upload url to object, s3Key: ${s3Key}`);
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 900,
    });

    this.logger.log(`Created document upload url to object, s3Key: ${s3Key}`);
    return uploadUrl;
  }

  async verifyDocumentUpload(s3Key: string) {
    try {
      const res = await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: s3Key,
        }),
      );

      return {
        exists: !!res.ContentLength,
        size: res.ContentLength,
        mimeType: res.ContentType,
        etag: res.ETag,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFound') {
        return {
          exists: false,
        };
      }
    }
  }
}
