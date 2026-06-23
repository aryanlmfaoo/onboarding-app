import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import accessPayload from '../auth/types/accesstoken.type';
import { createNewOrgDto } from './dto/createneworg.dto';
import { PrismaService } from '../prisma/prisma.service.js';
import { addEmployeeTokenDto } from './dto/addemployeetoken.dto';
import { addEmployeeToProjectDto } from './dto/addemployeetoproject.dto';
import { addEmployeeToOrganizationDto } from './dto/addemployeetoorg.dto.js';
import { createNewProjectDto } from './dto/createnewproject.dto';
import {
  EMPLOYEE_LEVEL,
  PROJECT_EMPLOYEE_LEVEL,
} from '../../generated/prisma/enums';

@Injectable()
export class OrganizationService {
  constructor(private readonly prismaService: PrismaService) {}

  private readonly logger = new Logger(OrganizationService.name);

  private canUserAddEmployee(
    userOrgLevel: EMPLOYEE_LEVEL,
    userProjectLevel: PROJECT_EMPLOYEE_LEVEL,
    employeeToBeAddedLevel: PROJECT_EMPLOYEE_LEVEL,
  ): boolean {
    const ALLOWED_PROJECT_ROLES: Partial<
      Record<PROJECT_EMPLOYEE_LEVEL, PROJECT_EMPLOYEE_LEVEL[]>
    > = {
      OWNER: ['ADMIN', 'EDITOR', 'VIEWER'],
      ADMIN: ['VIEWER'],
    };

    const ALLOWED_ORG_ROLES: Partial<
      Record<EMPLOYEE_LEVEL, PROJECT_EMPLOYEE_LEVEL[]>
    > = {
      OWNER: ['ADMIN', 'EDITOR', 'VIEWER'],
      ADMIN: ['EDITOR', 'VIEWER'],
    };
    if (ALLOWED_ORG_ROLES[userOrgLevel]?.includes(employeeToBeAddedLevel)) {
      return true;
    }
    return !!ALLOWED_PROJECT_ROLES[userProjectLevel]?.includes(
      employeeToBeAddedLevel,
    );
  }
  /**
   * @param user
   * @param createOrgDto
   * Create new organization for user.
   */
  async createNewOrganization(
    user: accessPayload,
    createOrgDto: createNewOrgDto,
  ) {
    this.logger.log(`Creating new organization for user: ${user.id}`);

    const hasOrganization = await this.prismaService.checkIfUserHasOrganization(
      user.id,
    );

    if (hasOrganization) {
      throw new HttpException(
        'User already has an organization',
        HttpStatus.METHOD_NOT_ALLOWED,
      );
    }

    const payload = {
      name: createOrgDto.name,
      logoUrl: createOrgDto.logoUrl,
      description: createOrgDto.description,
      ownerId: user.id,
    };
    const data = this.prismaService.createNewOrganization(payload);
    this.logger.log(`Created new organization for user: ${user.id}`);
    return data;
  }

  /**
   * @param createNewProjectDto
   * @param user
   * Business logic to create new project.
   */
  async createNewProject(
    createNewProjectDto: createNewProjectDto,
    user: accessPayload,
  ) {
    this.logger.log(`Creating new project under user: ${user.id}`);

    const userData = await this.prismaService.getUserById(user.id);

    if (!userData) {
      throw new UnauthorizedException('Please log in again.');
    }

    if (!userData.organizationId || !userData.level) {
      throw new ForbiddenException('You are not a member of any organization.');
    }

    const allowedRoles: EMPLOYEE_LEVEL[] = ['OWNER', 'ADMIN', 'MANAGER'];

    if (allowedRoles.includes(userData.level)) {
      throw new ForbiddenException(
        'You do not have the power to create a new project.',
      );
    }

    const projectData = await this.prismaService.createNewProject(
      createNewProjectDto.name.trim(),
      createNewProjectDto.description.trim(),
      userData.id,
      userData.organizationId,
    );
    return { projectId: projectData.id };
  }

  /**
   *
   * @param addEmployeeToProjectDto
   * @param user
   * Business logic to add org employee to project.
   */
  async addEmployeeToProject(
    addEmployeeToProjectDto: addEmployeeToProjectDto,
    user: accessPayload,
  ) {
    const userData = await this.prismaService.getUserAndProjectById(
      user.id,
      addEmployeeToProjectDto.projectId,
    );

    if (!userData) throw new UnauthorizedException('Please log in again.');

    if (!userData.organizationId || !userData.level)
      throw new ForbiddenException('You are not a member of any organization.');

    if (userData.employeeProjects.length === 0)
      throw new ForbiddenException('You are not a member of this group.');

    if (
      !this.canUserAddEmployee(
        userData.level,
        userData.employeeProjects[0].level,
        addEmployeeToProjectDto.level,
      )
    )
      throw new ForbiddenException(
        'You do not have the power to add the employee with the given permission.',
      );

    const userToBeAddedData = await this.prismaService.getUserById(
      addEmployeeToProjectDto.userToBeAdded.trim(),
    );

    if (!userToBeAddedData) {
      throw new NotFoundException(
        'The user you are trying to add does not exist.',
      );
    }

    if (userToBeAddedData.organizationId !== userData.organizationId) {
      throw new ForbiddenException(
        'The user you are trying to add is not a member of this organization.',
      );
    }

    if (userToBeAddedData.id === userData.id) {
      throw new ForbiddenException('You are already a member of this project.');
    }

    await this.prismaService.addEmployeeToProject(
      userData.id,
      addEmployeeToProjectDto.userToBeAdded.trim(),
      addEmployeeToProjectDto.projectId.trim(),
      addEmployeeToProjectDto.level,
      userData.organizationId,
    );

    // TODO notify everyone.

    return { success: true };
  }

  /**
   * @param addEmployeeTokenDto
   * @param user
   * Create token to add user to org. Token expires in 15 mins.
   */
  async addEmployeeEntryToken(
    addEmployeeTokenDto: addEmployeeTokenDto,
    user: accessPayload,
  ) {
    const userData = await this.prismaService.getUserById(user.id);

    if (!userData) {
      throw new NotFoundException('User does not exist.');
    }

    if (!userData.organizationId || !userData.level) {
      throw new ForbiddenException('User is not assigned to an organization.');
    }

    // check if employee has the rights to generate token.
    // Level assigning schema
    // OWNER - can create "ADMIN", "MANAGER", "EMPLOYEE"
    // ADMIN - can create "MANAGER" and "EMPLOYEE"
    // MANAGER - can create "EMPLOYEE"
    const allowedRoles: Record<string, string[]> = {
      OWNER: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
      ADMIN: ['MANAGER', 'EMPLOYEE'],
    };

    if (
      !allowedRoles[userData.level].includes(addEmployeeTokenDto.permissionType)
    ) {
      throw new ForbiddenException(
        'You are not allowed to create this type of employee',
      );
    }

    const admissionToken = crypto.randomUUID().toString();

    const tokenData = await this.prismaService.saveEmployeeToken(
      userData.organizationId,
      admissionToken,
      addEmployeeTokenDto.permissionType,
    );

    if (!tokenData) {
      throw new HttpException(
        'An internal error occurred.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // #TODO: send it in notifications to the person

    return { token: tokenData.token };
  }

  /**
   * @param addEmployeeToOrganizationDto
   * @param user
   * Verifies token and assigns user to organization.
   */
  async addEmployeeToOrganization(
    addEmployeeToOrganizationDto: addEmployeeToOrganizationDto,
    user: accessPayload,
  ) {
    this.logger.log(`Adding user ${user.id} to organization`);

    const userData = await this.prismaService.getUserById(user.id);

    if (!userData) {
      throw new NotFoundException('Please log in again.');
    }

    if (userData.organizationId) {
      throw new ForbiddenException(
        'You are already a member of an organization. Leave the organization before joining a new one.',
      );
    }

    const tokenData = await this.prismaService.fetchAdmissionToken(
      addEmployeeToOrganizationDto.admissionToken.trim(),
    );

    console.log(tokenData);

    // if token is not found, return error
    if (!tokenData) {
      throw new NotFoundException(
        'Token could not be found. Please generate a new one.',
      );
    }

    if (tokenData.expiresAt.getTime() < Date.now()) {
      throw new ForbiddenException('Token expired. Please generate a new one.');
    }

    if (tokenData.permissionLevel === 'OWNER') {
      throw new ForbiddenException(
        `There can be only one user, which is set up during organization creation.`,
      );
    }

    await this.prismaService.addEmployeeToOrganization(
      tokenData.organizationId,
      user.id,
      tokenData.permissionLevel,
    );
    // TODO add employee to company and notify people that they joined.
    this.logger.log(`Added user ${user.id} to organization`);
    return { orgId: tokenData.organizationId };
  }
}
