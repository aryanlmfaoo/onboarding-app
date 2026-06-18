import { Injectable, Logger } from '@nestjs/common';
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, EMPLOYEE_LEVEL } from '../../generated/prisma/client.js';
import { createNewUserDto } from './dto/newuser.dto.js';
import { createOrganizationDto } from './dto/neworganization.dto.js';

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
   * Fetch user data using their id
   */
  getUserById(id: string) {
    return this.employee.findUnique({ where: { id } });
  }

  /**
   *
   * @param email
   * Fetches data for user login
   */
  async getDataForLogin(email: string) {
    return this.employee.findFirst({
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
    return this.tokens.findFirst({ where: { userId, refreshTokenHash } });
  }

  // =============================================================== CREATING NEW DATA IN THE DB ===============================================================

  async saveTokenToDB(userId: string, refreshTokenHash: string) {
    await this.tokens.upsert({
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

    const newUser = await this.employee.create({
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
   *
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
    await this.employee.update({
      where: { id: orgInfo.ownerId },
      data: {
        organizationId: newOrganization.id,
        level: EMPLOYEE_LEVEL.OWNER,
      },
    });
    this.logger.log(
      `Created new Organization ${orgInfo.name} for user:${orgInfo.ownerId}`,
    );
    return { id: newOrganization.id };
  }
}
