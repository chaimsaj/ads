import type { EmailService } from './email.service';
import type { EmailResult } from '../types/notification.types';

export class EmailTemplateAccountService {
  constructor(private readonly emailService: EmailService) {}

  async sendVerificationEmail(to: string, code: string, name: string): Promise<EmailResult> {
    const html = `
      <h2>Verify your email address</h2>
      <p>Hi ${name},</p>
      <p>Your verification code is: <strong>${code}</strong></p>
      <p>This code expires in 15 minutes.</p>
      <p>If you didn't create an account, please ignore this email.</p>
    `;
    return this.emailService.sendTemplateEmail(to, 'Verify Your Email - Myngly Ads', html);
  }

  async sendPasswordResetEmail(to: string, resetUrl: string, name: string): Promise<EmailResult> {
    const html = `
      <h2>Reset your password</h2>
      <p>Hi ${name},</p>
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request a password reset, please ignore this email.</p>
    `;
    return this.emailService.sendTemplateEmail(to, 'Password Reset - Myngly Ads', html);
  }

  async sendWelcomeEmail(to: string, name: string): Promise<EmailResult> {
    const html = `
      <h2>Welcome to Myngly Ads!</h2>
      <p>Hi ${name},</p>
      <p>Your account has been created successfully. You can now create and manage your advertising campaigns.</p>
      <p>Get started by creating your first campaign today!</p>
    `;
    return this.emailService.sendTemplateEmail(to, 'Welcome to Myngly Ads', html);
  }

  async sendAdminInviteEmail(to: string, name: string, tempPassword: string): Promise<EmailResult> {
    const html = `
      <h2>Admin Account Created</h2>
      <p>Hi ${name},</p>
      <p>An admin account has been created for you on Myngly Ads.</p>
      <p>Your temporary password is: <strong>${tempPassword}</strong></p>
      <p>Please change your password after your first login.</p>
    `;
    return this.emailService.sendTemplateEmail(to, 'Admin Invitation - Myngly Ads', html);
  }

  async sendAccountSuspendedEmail(to: string, name: string, reason: string): Promise<EmailResult> {
    const html = `
      <h2>Account Suspended</h2>
      <p>Hi ${name},</p>
      <p>Your Myngly Ads account has been suspended.</p>
      <p>Reason: ${reason}</p>
      <p>If you believe this is a mistake, please contact our support team.</p>
    `;
    return this.emailService.sendTemplateEmail(to, 'Account Suspended - Myngly Ads', html);
  }

  async sendAccountReactivatedEmail(to: string, name: string): Promise<EmailResult> {
    const html = `
      <h2>Account Reactivated</h2>
      <p>Hi ${name},</p>
      <p>Your Myngly Ads account has been reactivated. You can now log in and resume using the platform.</p>
    `;
    return this.emailService.sendTemplateEmail(to, 'Account Reactivated - Myngly Ads', html);
  }

  async sendTwoFactorEnabledEmail(to: string, name: string): Promise<EmailResult> {
    const html = `
      <h2>Two-Factor Authentication Enabled</h2>
      <p>Hi ${name},</p>
      <p>Two-factor authentication has been enabled on your account. You will need to enter a code from your authenticator app when logging in.</p>
      <p>If you didn't make this change, please contact support immediately.</p>
    `;
    return this.emailService.sendTemplateEmail(to, 'Two-Factor Authentication Enabled - Myngly Ads', html);
  }
}
