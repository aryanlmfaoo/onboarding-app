import { IsNotEmpty, IsUUID } from 'class-validator';

export class addEmployeeToOrganizationDto {
  @IsUUID()
  @IsNotEmpty()
  admissionToken: string;
}
