import {
  IsNotEmpty,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class createOrganizationDto {
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  name: string;

  @IsUrl()
  logoUrl: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsUUID()
  @IsString()
  @IsNotEmpty()
  ownerId: string;
}
