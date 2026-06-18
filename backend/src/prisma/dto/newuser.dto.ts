import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class createNewUserDto {
  @IsString()
  @MaxLength(10)
  @MinLength(2)
  firstName: string;
  @IsString()
  @MaxLength(10)
  @MinLength(2)
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  passwordHash: string;

  @IsUrl()
  @IsNotEmpty()
  profilePictureUrl: string;
}
