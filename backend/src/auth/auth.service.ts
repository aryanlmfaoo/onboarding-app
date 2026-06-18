import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PasswordService } from './password/password.service.js';
import { registerUserDto } from './dto/registeruser.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { loginUserDto } from './dto/loginuser.dto.js';
import { TokenService } from './token/token.service.js';
import { refreshTokenDto } from './dto/refreshtoken.dto';
import crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private passwordService: PasswordService,
    private prismaService: PrismaService,
    private tokenService: TokenService,
  ) {}

  /**
   * @param registerUserDto
   * Business Logic for creating a new User/Employee.
   */
  async registerUser(registerUserDto: registerUserDto) {
    this.logger.log(`Registering user with email: ${registerUserDto.email}`);
    try {
      const hashedPassword = await this.passwordService.hashPassword(
        registerUserDto.password.trim(),
      );
      const dbData = {
        firstName: registerUserDto.firstName.trim(),
        lastName: registerUserDto.lastName.trim(),
        email: registerUserDto.email.trim(),
        passwordHash: hashedPassword,
        profilePictureUrl: registerUserDto.profilePictureUrl.trim(),
      };

      const userData = await this.prismaService.createNewUser(dbData);

      if (!userData) {
        throw new HttpException(
          `Could not create your profile.`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      this.logger.log(`User with email ${registerUserDto.email} registered.`);

      const tokenPayload = {
        email: userData.email,
        id: userData.id,
        level: userData.level || '',
        firstName: userData.firstName,
        profilePictureUrl: userData.profilePictureUrl,
        lastName: userData.lastName,
      };

      const { refreshToken, accessToken } =
        await this.tokenService.createAndSaveTokens(tokenPayload);

      return { refreshToken, accessToken };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        this.logger.error('User with this email already exists', error);
        throw new ConflictException('User with the same email already exists');
      }
    }
  }

  /**
   * @param loginUserDto : loginUserDto
   * Business Logic for user login.
   */
  async loginUser(loginUserDto: loginUserDto) {
    this.logger.log(`Login request for user with email: ${loginUserDto.email}`);

    const userData = await this.prismaService.getDataForLogin(
      loginUserDto.email,
    );

    if (!userData) {
      this.logger.error(`User with email:${loginUserDto.email} was not found.`);
      throw new UnauthorizedException('Invalid User Credentials');
    }

    const isValid = await this.passwordService.comparePassword(
      loginUserDto.password.trim(),
      userData.passwordHash,
    );

    if (!isValid) {
      this.logger.error(
        `Invalid Password for user with email: ${loginUserDto.email}`,
      );
      throw new UnauthorizedException('Invalid User Credentials');
    }

    const tokenPayload = {
      email: userData.email,
      id: userData.id,
      level: userData.level || '',
      firstName: userData.firstName,
      profilePictureUrl: userData.profilePictureUrl,
      lastName: userData.lastName,
    };
    const { refreshToken, accessToken } =
      await this.tokenService.createAndSaveTokens(tokenPayload);

    return { refreshToken, accessToken };
  }

  /**
   *
   * @param refreshTokenDto
   * Business Logic for refreshing access tokens
   */
  async refreshToken(refreshTokenDto: refreshTokenDto) {
    const payload = await this.tokenService.verifyRefreshToken(
      refreshTokenDto.refreshToken,
    );

    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshTokenDto.refreshToken)
      .digest('hex');

    const tokenData = await this.prismaService.fetchToken(
      payload.id,
      refreshTokenHash,
    );

    if (!tokenData) {
      throw new UnauthorizedException('Please log in again');
    }

    const userData = await this.prismaService.getUserById(payload.id);

    if (!userData) {
      throw new UnauthorizedException('Please log in again');
    }
    const tokenPayload = {
      email: userData.email,
      id: userData.id,
      level: userData.level || '',
      firstName: userData.firstName,
      profilePictureUrl: userData.profilePictureUrl,
      lastName: userData.lastName,
    };
    const { refreshToken, accessToken } =
      await this.tokenService.createAndSaveTokens(tokenPayload);

    return { refreshToken, accessToken };
  }
}
