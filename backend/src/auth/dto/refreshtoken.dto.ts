import { IsJWT, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class refreshTokenDto {
  @IsNotEmpty()
  @IsUUID(7)
  userId: string;

  @IsNotEmpty()
  @IsString()
  @IsJWT()
  refreshToken: string;
}
