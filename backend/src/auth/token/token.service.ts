import { Injectable, Logger } from '@nestjs/common';
import { createTokenDto } from './dto/createtoken.dto.js';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import accessPayload from '../types/accesstoken.type';
import refreshPayload from '../types/refreshtoken.type';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  private readonly logger = new Logger(TokenService.name);

  /**
   * @param createTokenDto
   * Creates new JWT Tokens and saves them in the DB.
   */
  async createAndSaveTokens(createTokenDto: createTokenDto) {
    const refreshPayload: refreshPayload = {
      email: createTokenDto.email,
      id: createTokenDto.id,
    };

    const accessPayload: accessPayload = {
      email: createTokenDto.email,
      id: createTokenDto.id,
      firstName: createTokenDto.firstName,
      profilePictureUrl: createTokenDto.profilePictureUrl,
      lastName: createTokenDto.lastName,
    };

    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '30d',
    });
    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: '15m',
    });

    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    await this.prismaService.saveTokenToDB(createTokenDto.id, refreshTokenHash);

    this.logger.log(`Issued tokens for user with id: ${createTokenDto.id}`);
    return { refreshToken, accessToken };
  }

  async verifyRefreshToken(
    refreshToken: string,
  ): Promise<{ id: string; email: string }> {
    return this.jwtService.verifyAsync(refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });
  }
}
