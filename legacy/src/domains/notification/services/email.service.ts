import { createLogger } from '../../../infrastructure/logging/logger';
import { getSendGridClient, isSendGridConfigured, getFromEmail } from '../config/sendgrid.config';
import type { IEmailService } from '../interfaces/email-service.interface';
import type { EmailData, EmailResult, RecentEmailDTO } from '../types/notification.types';

const logger = createLogger('email-service');

export class EmailService implements IEmailService {
  private sentCount = 0;
  private failedCount = 0;
  private recentEmails: RecentEmailDTO[] = [];
  private readonly maxRecentEmails = 100;

  async sendEmail(data: EmailData): Promise<EmailResult> {
    if (!isSendGridConfigured()) {
      logger.warn('SendGrid not configured, email not sent', { to: data.to, subject: data.subject });
      this.trackEmail(data.to, data.subject, false, 'SendGrid not configured');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const client = getSendGridClient();
      const from = getFromEmail();

      const msg = {
        to: data.to,
        from,
        subject: data.subject,
        text: data.text ?? data.html ?? '',
        html: data.html,
      };

      const [response] = await client.send(msg);

      const messageId = response.headers['x-message-id'] as string | undefined;
      logger.info('Email sent', { to: data.to, subject: data.subject, messageId });
      this.trackEmail(data.to, data.subject, true);
      return { success: true, messageId };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to send email', { to: data.to, subject: data.subject, error: message });
      this.trackEmail(data.to, data.subject, false, message);
      return { success: false, error: message };
    }
  }

  async sendTemplateEmail(to: string, subject: string, html: string): Promise<EmailResult> {
    return this.sendEmail({ to, subject, html });
  }

  getStats() {
    const byDayMap: Record<string, { sent: number; failed: number }> = {};
    for (const email of this.recentEmails) {
      const date = email.sentAt instanceof Date
        ? email.sentAt.toISOString().slice(0, 10)
        : String(email.sentAt).slice(0, 10);
      if (!byDayMap[date]) {
        byDayMap[date] = { sent: 0, failed: 0 };
      }
      if (email.status === 'sent') {
        byDayMap[date].sent++;
      } else {
        byDayMap[date].failed++;
      }
    }

    const byDay = Object.entries(byDayMap)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalSent: this.sentCount,
      totalFailed: this.failedCount,
      recentEmails: [...this.recentEmails],
      byDay,
    };
  }

  private trackEmail(to: string, subject: string, success: boolean, error?: string): void {
    if (success) {
      this.sentCount++;
    } else {
      this.failedCount++;
    }

    this.recentEmails.unshift({
      to,
      subject,
      status: success ? 'sent' : 'failed',
      sentAt: new Date(),
      error,
    });

    if (this.recentEmails.length > this.maxRecentEmails) {
      this.recentEmails = this.recentEmails.slice(0, this.maxRecentEmails);
    }
  }
}
