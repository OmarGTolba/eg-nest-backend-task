export interface IEmailPayload {
  to: string;
  subject: string;
  html: string;
  context?: Record<string, any>;
}

export interface IPasswordResetPayload {
  email: string;
  resetCode: string;
  userName?: string;
}

export interface IEmailVerificationPayload {
  email: string;
  verificationToken: string;
  userName?: string;
}

export interface IWelcomeEmailPayload {
  email: string;
  userName: string;
}