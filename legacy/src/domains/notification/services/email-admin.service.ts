import { createLogger } from '../../../infrastructure/logging/logger';
import type { EmailService } from './email.service';
import type { EmailResult, EmailStatsDTO, BulkEmailData } from '../types/notification.types';

const logger = createLogger('email-admin-service');

export class EmailAdminService {
  constructor(private readonly emailService: EmailService) {}

  getStats(): EmailStatsDTO {
    return this.emailService.getStats();
  }

  async sendBulk(data: BulkEmailData): Promise<{ sent: number; failed: number; results: readonly EmailResult[] }> {
    const results: EmailResult[] = [];
    let sent = 0;
    let failed = 0;

    for (const to of data.to) {
      const result = await this.emailService.sendEmail({
        to,
        subject: data.subject,
        text: data.text,
        html: data.html,
      });

      results.push(result);
      if (result.success) {
        sent++;
      } else {
        failed++;
      }
    }

    logger.info('Bulk email completed', { total: data.to.length, sent, failed });
    return { sent, failed, results };
  }
}
