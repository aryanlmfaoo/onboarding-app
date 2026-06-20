import { IsNotEmpty, IsString } from 'class-validator';

export class createNewProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
