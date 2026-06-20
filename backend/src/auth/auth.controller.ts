import { Controller, HttpCode, Post, HttpStatus, Body } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { registerUserDto } from './dto/registeruser.dto.js';
import { loginUserDto } from './dto/loginuser.dto.js';
import { refreshTokenDto } from './dto/refreshtoken.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * @param registerUserDto
   * Method: POST
   * Path: /auth/register
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async registerUser(@Body() registerUserDto: registerUserDto) {
    return await this.authService.registerUser(registerUserDto);
  }

  /**
   * @param userLoginDto : userLoginDto
   * Method: POST
   * Path: /auth/login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginUser(@Body() userLoginDto: loginUserDto) {
    return await this.authService.loginUser(userLoginDto);
  }

  /**
   * @param refreshTokenDto
   * Method: POST
   * Path: /auth/refresh
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: refreshTokenDto) {
    return await this.authService.refreshToken(refreshTokenDto);
  }
}
