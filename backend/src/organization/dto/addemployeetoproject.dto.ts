import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { PROJECT_EMPLOYEE_LEVEL } from '../../../generated/prisma/enums';

export class addEmployeeToProjectDto {
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID(7)
  userToBeAdded: string;

  @IsString()
  @IsNotEmpty()
  level: PROJECT_EMPLOYEE_LEVEL;
}
