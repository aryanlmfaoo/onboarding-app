import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import accessPayload from '../auth/types/accesstoken.type';
import { UploadDocumentDto } from './dto/uploaddocument.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PROJECT_EMPLOYEE_LEVEL } from '../../generated/prisma/enums';
import { ObjectstoreService } from './objectstore/objectstore.service';
import { KafkaService } from '../kafka/kafka.service';
import { VerifyDocumentUploadDto } from './dto/verifydocumentupload.dto';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly objectStoreService: ObjectstoreService,
    private readonly kafkaService: KafkaService,
  ) {}

  async uploadDocumentMetaData(
    uploadDocumentDto: UploadDocumentDto,
    user: accessPayload,
  ) {
    this.logger.log(
      `Uploading document to project ${uploadDocumentDto.projectId}`,
    );

    const userAndProjectData =
      await this.prismaService.getDataForDocumentUpload(
        user.id,
        uploadDocumentDto.projectId.trim(),
        uploadDocumentDto.orgId.trim(),
      );

    if (
      !userAndProjectData ||
      !userAndProjectData.organizationId ||
      !userAndProjectData.level ||
      !userAndProjectData.employeeProjects ||
      userAndProjectData.employeeProjects.length === 0
    ) {
      throw new NotFoundException(
        'User (or their related projects) could not be found.',
      );
    }

    const ROLES_ALLOWED_TO_UPLOAD: PROJECT_EMPLOYEE_LEVEL[] = [
      'OWNER',
      'ADMIN',
      'EDITOR',
    ];

    if (
      !ROLES_ALLOWED_TO_UPLOAD.includes(
        userAndProjectData.employeeProjects[0].level,
      )
    ) {
      throw new ForbiddenException(
        'You are not allowed to upload files to this project.',
      );
    }

    const docId = crypto.randomUUID();

    const s3Key = `organizations/${userAndProjectData.organizationId}/projects/${uploadDocumentDto.projectId}/documents/${docId}`;

    const uploadUrl = await this.objectStoreService.uploadDocumentUrl(
      s3Key,
      uploadDocumentDto.mimeType,
    );

    const payload = {
      id: docId,
      orgId: userAndProjectData.organizationId,
      projId: uploadDocumentDto.projectId,
      filename: uploadDocumentDto.fileName,
      objectKey: s3Key,
      mimeType: uploadDocumentDto.mimeType,
      fileSize: uploadDocumentDto.fileSize,
      uploadedBy: userAndProjectData.id,
    };

    await this.prismaService.uploadDocumentMetaData(payload);

    return { docId, uploadUrl, s3Key };
  }

  async verifyUpload(verifyDocumentUploadDto: VerifyDocumentUploadDto) {
    this.logger.log(
      `Verifying document upload for s3Key: ${verifyDocumentUploadDto.s3Key}`,
    );

    const docData = await this.objectStoreService.verifyDocumentUpload(
      verifyDocumentUploadDto.s3Key.trim(),
    );

    if (!docData || !docData.exists) {
      this.logger.log(
        `Could not find document for s3Key: ${verifyDocumentUploadDto.s3Key}`,
      );
      throw new NotFoundException('Could not find document in bucket.');
    }

    this.logger.log(
      `Verified document upload for s3Key: ${verifyDocumentUploadDto.s3Key}`,
    );

    await this.kafkaService.documentUploaded(
      verifyDocumentUploadDto.id,
      verifyDocumentUploadDto.s3Key,
    );

    await this.prismaService.markDocumentAsUploaded(verifyDocumentUploadDto.id);

    return { success: true };
  }
}
