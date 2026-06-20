import { IsNotEmpty, IsString } from 'class-validator';

export class addEmployeeTokenDto {
  @IsString()
  @IsNotEmpty()
  permissionType: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
}
