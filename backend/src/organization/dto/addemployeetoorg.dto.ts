import { IsNotEmpty, IsString } from 'class-validator';

export class addEmployeeToOrganizationDto {
  @IsString()
  @IsNotEmpty()
  admissionToken: string;
}
