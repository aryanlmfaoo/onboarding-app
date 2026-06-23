import {
  IsMimeType,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
} from 'class-validator';

export class UploadDocumentDto {
  @IsUUID()
  @IsNotEmpty()
  orgId: string;

  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsNotEmpty()
  @IsMimeType()
  mimeType: string;

  @IsNumber()
  @IsNotEmpty()
  fileSize: number;
}
