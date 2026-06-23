import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class VerifyDocumentUploadDto {
  @IsString()
  @IsNotEmpty()
  s3Key: string;

  @IsUUID()
  @IsNotEmpty()
  id: string;
}
