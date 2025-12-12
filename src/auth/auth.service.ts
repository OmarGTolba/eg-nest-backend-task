import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UsersService } from '../users/users.service';
import { UserRepository } from '../users/repositories/user.repository';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthResponseDto, TokenResponseDto, MessageResponseDto } from './dto/auth-response.dto';
import { EMAIL_EVENTS } from '../common/constants/email-events';
import * as crypto from 'crypto';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MINUTES = 30;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.accountLockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new ForbiddenException(
        `Account is locked. Try again in ${minutesLeft} minutes.`,
      );
    }

    const matched = await bcrypt.compare(password, user.password);
    
    if (!matched) {
      await this.userRepository.incrementLoginAttempts(user._id.toString());
      
      const attempts = (user.loginAttempts || 0) + 1;
      
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        await this.userRepository.lockAccount(user._id.toString(), LOCK_TIME_MINUTES);
        throw new ForbiddenException(
          `Account locked due to too many failed login attempts. Try again in ${LOCK_TIME_MINUTES} minutes.`,
        );
      }
      
      const remainingAttempts = MAX_LOGIN_ATTEMPTS - attempts;
      throw new UnauthorizedException(
        `Invalid credentials. ${remainingAttempts} attempts remaining.`,
      );
    }

    if (user.loginAttempts && user.loginAttempts > 0) {
      await this.userRepository.resetLoginAttempts(user._id.toString());
    }

    await this.userRepository.update(user._id.toString(), {
      lastLogin: new Date(),
    });

    const { password: _, refreshToken: __, ...result } = user.toObject();
    return result;
  }

  private generateTokens(userId: string, email: string, role: string): TokenResponseDto {
    const payload = { sub: userId, email, role };
    
    const access_token = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });
    
    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return {
      access_token,
      refresh_token,
      expiresIn: 900, 
    };
  }

  async login(user: any): Promise<AuthResponseDto> {
    try {
      const tokens = this.generateTokens(
        user._id.toString(),
        user.email,
        user.role,
      );

      const hashedRefreshToken = await bcrypt.hash(tokens.refresh_token, 10);
      await this.userRepository.update(user._id.toString(), {
        refreshToken: hashedRefreshToken,
      });

      this.logger.log(`User logged in: ${user.email}`);

      return {
        statusCode: 200,
        message: 'Login successful',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        user: {
          _id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: user.isEmailVerified || false,
        },
      };
    } catch (error) {
      this.logger.error(`Login failed for user ${user.email}`, error.stack);
      throw new InternalServerErrorException('Failed to login');
    }
  }

  async signup(createUserDto: CreateUserDto): Promise<AuthResponseDto> {
    try {
      const userResponse = await this.usersService.create(createUserDto);
      
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const user = await this.usersService.findByEmail(userResponse.email);
      
      if (!user) {
        throw new InternalServerErrorException('Failed to create user');
      }

      await this.userRepository.update(user._id.toString(), {
        emailVerificationToken: verificationToken,
      });

      this.eventEmitter.emit(EMAIL_EVENTS.EMAIL_VERIFICATION, {
        email: user.email,
        verificationToken,
        userName: user.firstName || user.email,
      });

      const tokens = this.generateTokens(
        user._id.toString(),
        user.email,
        user.role,
      );

      const hashedRefreshToken = await bcrypt.hash(tokens.refresh_token, 10);
      await this.userRepository.update(user._id.toString(), {
        refreshToken: hashedRefreshToken,
      });

      this.logger.log(`User registered: ${user.email}`);

      return {
        statusCode: 201,
        message: 'User created successfully. Please verify your email.',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        user: {
          _id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: false,
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to create user');
    }
  }

  async refreshTokens(refreshToken: string): Promise<TokenResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      
      const user = await this.userRepository.findById(payload.sub);
      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!isValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = this.generateTokens(
        user._id.toString(),
        user.email,
        user.role,
      );

      const hashedRefreshToken = await bcrypt.hash(tokens.refresh_token, 10);
      await this.userRepository.update(user._id.toString(), {
        refreshToken: hashedRefreshToken,
      });

      this.logger.log(`Tokens refreshed for user: ${user.email}`);

      return tokens;
    } catch (error) {
      this.logger.error('Token refresh failed', error.stack);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string): Promise<MessageResponseDto> {
    await this.userRepository.update(userId, {
      refreshToken: undefined,
    });

    this.logger.log(`User logged out: ${userId}`);

    return {
      statusCode: 200,
      message: 'Logged out successfully',
    };
  }

  async verifyEmail(token: string): Promise<MessageResponseDto> {
    const user = await this.userRepository.findAll({
      emailVerificationToken: token,
    });

    if (!user || user.length === 0) {
      throw new BadRequestException('Invalid verification token');
    }

    const foundUser = user[0];

    await this.userRepository.update(foundUser._id.toString(), {
      isEmailVerified: true,
      emailVerificationToken: undefined,
    });

    this.eventEmitter.emit(EMAIL_EVENTS.WELCOME, {
      email: foundUser.email,
      userName: foundUser.firstName || foundUser.email,
    });

    this.logger.log(`Email verified for user: ${foundUser.email}`);

    return {
      statusCode: 200,
      message: 'Email verified successfully',
    };
  }

  async resendVerificationEmail(email: string): Promise<MessageResponseDto> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      return {
        statusCode: 200,
        message: 'If that email exists, a verification email has been sent',
      };
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await this.userRepository.update(user._id.toString(), {
      emailVerificationToken: verificationToken,
    });

    this.eventEmitter.emit(EMAIL_EVENTS.EMAIL_VERIFICATION, {
      email: user.email,
      verificationToken,
      userName: user.firstName || user.email,
    });

    return {
      statusCode: 200,
      message: 'Verification email sent',
    };
  }

  async sendResetCode(email: string): Promise<MessageResponseDto> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return {
        statusCode: 200,
        message: 'If that email exists, a reset code has been sent',
      };
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    await this.userRepository.update(user._id.toString(), {
      resetPasswordCode: resetCode,
      resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
    });

    this.eventEmitter.emit(EMAIL_EVENTS.PASSWORD_RESET, {
      email: user.email,
      resetCode,
      userName: user.firstName || user.email,
    });

    return {
      statusCode: 200,
      message: 'Reset code sent to your email',
    };
  }

  async verifyResetCode(email: string, code: string): Promise<MessageResponseDto> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    if (
      !user.resetPasswordCode ||
      user.resetPasswordCode !== code ||
      user.resetPasswordExpires! < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    return { statusCode: 200, message: 'Code verified successfully' };
  }

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<MessageResponseDto> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    if (
      !user.resetPasswordCode ||
      user.resetPasswordCode !== code ||
      user.resetPasswordExpires! < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.userRepository.update(user._id.toString(), {
        password: hashedPassword,
        resetPasswordCode: undefined,
        resetPasswordExpires: undefined,
        refreshToken: undefined, 
      });

      this.logger.log(`Password reset successful for user: ${email}`);
      return { statusCode: 200, message: 'Password updated successfully' };
    } catch (error) {
      this.logger.error(`Failed to reset password for ${email}`, error.stack);
      throw new InternalServerErrorException('Failed to reset password');
    }
  }
}