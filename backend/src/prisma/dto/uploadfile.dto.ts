import {
  IsMimeType,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class UploadFileDto {
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsNotEmpty()
  @IsUUID()
  orgId: string;

  @IsNotEmpty()
  @IsUUID()
  projId: string;

  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsNotEmpty()
  objectKey: string;

  @IsNotEmpty()
  @IsMimeType()
  mimeType: string;

  @IsNumber()
  @Min(0)
  fileSize: number;

  @IsUUID()
  @IsNotEmpty()
  uploadedBy: string;
}
