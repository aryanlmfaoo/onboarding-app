import { IsEmail, IsNotEmpty, IsString, IsUrl, IsUUID } from 'class-validator';

export class createTokenDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsUUID(7)
  id: string;

  @IsString()
  level: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  @IsUrl()
  profilePictureUrl: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;
}
