import { 
  BadRequestException, 
  Injectable, 
  UnauthorizedException, 
  NotFoundException, 
  InternalServerErrorException 
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/common/email.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService, 
    private jwtService: JwtService, 
    private emailService: EmailService
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const matched = await bcrypt.compare(password, user.password);
    if (!matched) throw new UnauthorizedException('Invalid credentials');

    const { password: _, ...result } = user.toObject();
    return result;
  }

  
  async login(user: any) {
    try {
      const payload = { sub: user._id, email: user.email, role: user.role };
      return {
        statusCode: 200,
        message: 'Login successful',
        access_token: this.jwtService.sign(payload),
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to login');
    }
  }

  
  async signup(createUserDto: any) {
    try {
      const user = await this.usersService.create(createUserDto);
      const payload = { sub: user._id, email: user.email, role: user.role };
      return {
        statusCode: 201,
        message: 'User created successfully',
        user,
        access_token: this.jwtService.sign(payload),
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to create user');
    }
  }

  
  async sendResetCode(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
     
      return { statusCode: 200, message: 'If that email exists, a reset code has been sent' };
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min expiry

    try {
      await user.save();
      await this.emailService.sendMail(
        email,
        'Your Password Reset Code',
        `<p>Your reset code is: <b>${resetCode}</b></p>`,
      );

      return { statusCode: 200, message: 'Reset code sent to your email' };
    } catch (error) {
      throw new InternalServerErrorException('Failed to send reset code');
    }
  }

  async verifyResetCode(email: string, code: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    if (!user.resetPasswordCode || user.resetPasswordCode !== code || user.resetPasswordExpires! < new Date()) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    return { statusCode: 200, message: 'Code verified successfully' };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    if (!user.resetPasswordCode || user.resetPasswordCode !== code || user.resetPasswordExpires! < new Date()) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    try {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);

      user.resetPasswordCode = undefined;
      user.resetPasswordExpires = undefined;

      await user.save();

      return { statusCode: 200, message: 'Password updated successfully' };
    } catch (error) {
      throw new InternalServerErrorException('Failed to reset password');
    }
  }
}
