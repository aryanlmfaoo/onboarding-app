import { Injectable, Logger } from '@nestjs/common';
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  EMPLOYEE_LEVEL,
  PrismaClient,
  PROJECT_EMPLOYEE_LEVEL,
} from '../../generated/prisma/client.js';
import { createNewUserDto } from './dto/newuser.dto.js';
import { createOrganizationDto } from './dto/neworganization.dto.js';
import { UploadFileDto } from './dto/uploadfile.dto';

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
  async getUserById(id: string) {
    return this.user.findUnique({ where: { id } });
  }

  async getUserAndProjectById(userId: string, projectId: string) {
    return this.user.findUnique({
      where: { id: userId },
      include: { employeeProjects: { where: { projectId: projectId } } },
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
    const tokenData = await this.admissionTokens.findFirst({
      where: { token },
    });
    if (tokenData) this.logger.log(`Found admission token: ${token}`);
    else this.logger.log(`Could not find admission token: ${token}`);
    return tokenData;
  }

  async getDataForDocumentUpload(
    userId: string,
    projectId: string,
    orgId: string,
  ) {
    this.logger.log(`Fetching data for document upload for user: ${userId}`);
    const data = await this.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        employeeProjects: {
          where: {
            projectId: projectId,
            employeeId: userId,
            organizationId: orgId,
          },
        },
      },
    });
    this.logger.log(
      `Done fetching data for document upload for user: ${userId}`,
    );
    return data;
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

    return this.admissionTokens.create({
      data: {
        organizationId: orgId,
        token: token,
        permissionLevel: permission,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
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
        ownerId: userId,
        members: {
          create: [
            {
              employeeId: userId,
              level: EMPLOYEE_LEVEL.OWNER,
              organizationId: orgId,
              addedBy: userId,
            },
          ],
        },
      },
    });
    this.logger.log(`Created project: ${name}`);
    return { id: project.id };
  }

  async addEmployeeToProject(
    addedById: string,
    employeeId: string,
    projectId: string,
    projLevel: PROJECT_EMPLOYEE_LEVEL,
    orgId: string,
  ) {
    return this.projectEmployee.upsert({
      where: {
        employeeId_projectId: { employeeId: employeeId, projectId: projectId },
      },
      create: {
        employeeId: employeeId,
        projectId: projectId,
        level: projLevel,
        organizationId: orgId,
        addedBy: addedById,
      },
      update: { employeeId: employeeId },
    });
  }

  async uploadDocumentMetaData(fileData: UploadFileDto) {
    this.logger.log(
      `Adding documentMetaData for project ${fileData.projId} by ${fileData.uploadedBy}`,
    );

    await this.documentMetaData.create({
      data: {
        id: fileData.id,
        organizationId: fileData.orgId,
        projectId: fileData.projId,
        filename: fileData.filename,
        fileSize: fileData.fileSize,
        mimeType: fileData.mimeType,
        uploadedBy: fileData.uploadedBy,
        objectKey: fileData.objectKey,
      },
    });

    this.logger.log(
      `Added documentMetaData for project ${fileData.projId} by ${fileData.uploadedBy}`,
    );
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

  async markDocumentAsUploaded(id: string) {
    return this.documentMetaData.update({
      where: { id: id, status: 'NOTUPLOADED' },
      data: { status: 'UNPROCESSED' },
    });
  }
}
