import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class createNewOrgDto {
  @IsString()
  @IsNotEmpty()
  name: string;
  @IsString()
  @IsNotEmpty()
  description: string;
  @IsUrl()
  @IsNotEmpty()
  logoUrl: string;
}
