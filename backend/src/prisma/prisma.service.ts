import { Injectable, Logger } from '@nestjs/common';
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  EMPLOYEE_LEVEL,
  PROJECT_EMPLOYEE_LEVEL,
} from '../../generated/prisma/client.js';
import { createNewUserDto } from './dto/newuser.dto.js';
import { createOrganizationDto } from './dto/neworganization.dto.js';
import { create } from 'node:domain';
import { Prisma } from '@prisma/client/extension';

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });

@Injectable()
export class PrismaService extends PrismaClient {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({ adapter });
  }

  // =============================================================== GETTING DATA FROM THE DB ===============================================================

  /**
   * @param id
   * Fetch user data by id
   */
  getUserById(id: string) {
    return this.user.findUnique({ where: { id } });
  }

  async getUserAndProjectById(userId: string, projectId: string) {
    return this.user.findUnique({
      where: { id: userId },
      include: { projectMemberships: { where: { projectId: projectId } } },
    });
  }

  /**
   *
   * Fetch project data by id.
   * @param projectId
   */
  async getProjectById(projectId: string) {
    return this.project.findUnique({
      where: { id: projectId },
    });
  }

  /**
   * @param email
   * Fetches data for user login
   */
  async getDataForLogin(email: string) {
    return this.user.findFirst({
      where: { email },
      select: {
        email: true,
        passwordHash: true,
        id: true,
        level: true,
        firstName: true,
        profilePictureUrl: true,
        lastName: true,
      },
    });
  }

  /**
   *
   * @param userId
   * @param refreshTokenHash
   * Fetch tokenData for token refresh.
   */
  async fetchToken(userId: string, refreshTokenHash: string) {
    return this.jwtTokens.findFirst({ where: { userId, refreshTokenHash } });
  }

  /**
   * @param userId
   * Returns true if there exists an organization with the given user as owner
   */
  async checkIfUserHasOrganization(userId: string) {
    return (
      (await this.organization.count({ where: { ownerId: userId } })) !== 0
    );
  }

  /**
   * @param token
   * Fetch org admission token from db.
   */
  async fetchAdmissionToken(token: string) {
    this.logger.log(`Fetching admission token: ${token}`);
    const tokenData = await this.admissionTokens.findUnique({
      where: { token },
    });
    this.logger.log(`Found admission token: ${token}`);
    return tokenData;
  }

  // =============================================================== CREATING NEW DATA IN THE DB ===============================================================

  /**
   * @param userId
   * @param refreshTokenHash
   * Function upserts a new JWT token to the db.
   */
  async saveTokenToDB(userId: string, refreshTokenHash: string) {
    await this.jwtTokens.upsert({
      where: { userId },
      update: { refreshTokenHash },
      create: { userId, refreshTokenHash },
    });
  }

  /**
   * @param userData : createNewUserDto
   * Function creates a new user with the given data.
   */
  async createNewUser(userData: createNewUserDto) {
    this.logger.log(`Creating user with email ${userData.email}`);

    const newUser = await this.user.create({
      data: {
        profilePictureUrl: userData.profilePictureUrl,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        passwordHash: userData.passwordHash,
      },
    });
    this.logger.log(`Created employee with Id ${newUser.id}`);
    return newUser;
  }

  /**
   * @param orgInfo :createOrganizationDto
   * Creates new organization for the user, and set user as owner for the org.
   */
  async createNewOrganization(orgInfo: createOrganizationDto) {
    this.logger.log(
      `Creating organization ${orgInfo.name} for user:${orgInfo.ownerId}`,
    );
    const newOrganization = await this.organization.create({
      data: {
        ownerId: orgInfo.ownerId,
        name: orgInfo.name,
        description: orgInfo.description,
        logoUrl: orgInfo.logoUrl,
      },
    });
    await this.user.update({
      where: { id: orgInfo.ownerId },
      data: {
        organizationId: newOrganization.id,
        level: EMPLOYEE_LEVEL.OWNER,
      },
    });
    this.logger.log(
      `Created new Organization ${orgInfo.name} for user:${orgInfo.ownerId}`,
    );
    return { orgId: newOrganization.id };
  }

  /**
   * @param orgId
   * @param token
   * @param permission
   * Save employee admission token
   */
  async saveEmployeeToken(
    orgId: string,
    token: string,
    permission: 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE',
  ) {
    this.logger.log(`Saving admission token for org ${orgId}`);

    const newToken = await this.admissionTokens.create({
      data: {
        organizationId: orgId,
        token: token,
        permissionLevel: permission,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
    return { id: newToken.id };
  }

  /**
   * @param name
   * @param description
   * @param userId
   * @param orgId
   * Creates new project under the org with the given user as OWNER.
   */
  async createNewProject(
    name: string,
    description: string,
    userId: string,
    orgId: string,
  ) {
    this.logger.log(
      `Creating project: ${name} and adding user:${userId} as owner.`,
    );
    const project = await this.project.create({
      data: {
        name: name,
        description: description,
        organizationId: orgId,
        members: {
          create: [
            {
              employeeId: userId,
              level: EMPLOYEE_LEVEL.OWNER,
            },
          ],
        },
      },
    });
    this.logger.log(`Created project: ${name}`);
    return { id: project.id };
  }

  async addEmployeeToProject(
    employeeId: string,
    projectId: string,
    projLevel: PROJECT_EMPLOYEE_LEVEL,
  ) {
    return this.projectEmployee.upsert({
      where: {
        employeeId_projectId: { employeeId: employeeId, projectId: projectId },
      },
      create: {
        employeeId: employeeId,
        projectId: projectId,
        level: projLevel,
      },
      update: { employeeId: employeeId },
    });
  }
  // =============================================================== UPDATING OLD DATA IN THE DB ===============================================================

  /**
   * @param orgId
   * @param userId
   * @param permissionLevel
   * Updates employee and adds them to org.
   */
  async addEmployeeToOrganization(
    orgId: string,
    userId: string,
    permissionLevel: 'MANAGER' | 'ADMIN' | 'EMPLOYEE',
  ) {
    this.logger.log(`Adding user:${userId} to org:${orgId}`);
    await this.user.update({
      where: { id: userId },
      data: { organizationId: orgId, level: permissionLevel },
    });
    this.logger.log(`Added user:${userId} to org:${orgId}`);
  }
}
