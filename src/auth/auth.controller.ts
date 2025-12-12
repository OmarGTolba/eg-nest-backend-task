import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';

import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @ApiOperation({ summary: 'Sign up a new user' })
  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto) {
    return this.authService.signup(createUserDto);
  }
   
  

  @Post('verify-reset-code')
  async verifyResetCode(
    @Body() body: { email: string; code: string }
  ) {
    return this.authService.verifyResetCode(body.email, body.code);
  }

    @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.sendResetCode(email);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() body: { email: string; code: string; newPassword: string },
  ) {
    return this.authService.resetPassword(body.email, body.code, body.newPassword);
  }
  @ApiOperation({ summary: 'Sign in and get JWT token' })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      return { statusCode: 401, message: 'Invalid credentials' };
    }
    return this.authService.login(user);
  }
}
