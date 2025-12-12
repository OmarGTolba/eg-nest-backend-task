import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailService } from '../email.service';
import { EMAIL_EVENTS } from '../constants/email-events';
import * as EmailInterfaces from '../interfaces/email.interface';

@Injectable()
export class EmailListener {
  private readonly logger = new Logger(EmailListener.name);

  constructor(private readonly emailService: EmailService) {}

  @OnEvent(EMAIL_EVENTS.PASSWORD_RESET)
  async handlePasswordReset(payload: EmailInterfaces.IPasswordResetPayload): Promise<void> {
    this.logger.log(`Processing password reset email for: ${payload.email}`);
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hello ${payload.userName || 'User'},</p>
        <p>You have requested to reset your password. Your reset code is:</p>
        <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">
          ${payload.resetCode}
        </div>
        <p>This code will expire in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `;

    try {
      await this.emailService.sendMail(payload.email, 'Password Reset Code', html);
      this.logger.log(`Password reset email sent successfully to: ${payload.email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to: ${payload.email}`, error.stack);
    }
  }

  @OnEvent(EMAIL_EVENTS.EMAIL_VERIFICATION, { async: true })
  async handleEmailVerification(payload: EmailInterfaces.IEmailVerificationPayload): Promise<void> {
    this.logger.log(`Processing email verification for: ${payload.email}`);
    
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${payload.verificationToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify Your Email Address</h2>
        <p>Hello ${payload.userName || 'User'},</p>
        <p>Thank you for registering! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="background: #f4f4f4; padding: 10px; word-break: break-all;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `;

    try {
      await this.emailService.sendMail(payload.email, 'Verify Your Email Address', html);
      this.logger.log(`Verification email sent successfully to: ${payload.email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to: ${payload.email}`, error.stack);
    }
  }

  @OnEvent(EMAIL_EVENTS.WELCOME, { async: true })
  async handleWelcomeEmail(payload: EmailInterfaces.IWelcomeEmailPayload): Promise<void> {
    this.logger.log(`Processing welcome email for: ${payload.email}`);
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Our Platform!</h2>
        <p>Hello ${payload.userName},</p>
        <p>Your email has been verified successfully. Welcome aboard!</p>
        <p>You can now enjoy all the features of our platform.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard" style="background: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Go to Dashboard
          </a>
        </div>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `;

    try {
      await this.emailService.sendMail(payload.email, 'Welcome!', html);
      this.logger.log(`Welcome email sent successfully to: ${payload.email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to: ${payload.email}`, error.stack);
    }
  }
}