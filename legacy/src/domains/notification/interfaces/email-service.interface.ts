import type { EmailData, EmailResult } from '../types/notification.types';

export interface IEmailService {
  sendEmail(data: EmailData): Promise<EmailResult>;
  sendTemplateEmail(to: string, subject: string, html: string): Promise<EmailResult>;
}
