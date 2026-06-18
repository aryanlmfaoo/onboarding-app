import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { PasswordService } from './password/password.service.js';
import { TokenService } from './token/token.service.js';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule.register({})],
  providers: [AuthService, PasswordService, TokenService],
  controllers: [AuthController],
})
export class AuthModule {}
