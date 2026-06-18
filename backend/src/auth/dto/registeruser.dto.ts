import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class registerUserDto {
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
  @IsStrongPassword()
  password: string;

  @IsUrl()
  @IsNotEmpty()
  profilePictureUrl: string;
}
