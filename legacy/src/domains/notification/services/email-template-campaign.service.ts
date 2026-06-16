import type { EmailService } from './email.service';
import type { EmailResult } from '../types/notification.types';

export class EmailTemplateCampaignService {
  constructor(private readonly emailService: EmailService) {}

  async sendCampaignSubmittedEmail(to: string, name: string, campaignName: string): Promise<EmailResult> {
    const html = `
      <h2>Campaign Submitted for Review</h2>
      <p>Hi ${name},</p>
      <p>Your campaign "<strong>${campaignName}</strong>" has been submitted for review.</p>
      <p>We will notify you once the review is complete.</p>
    `;
    return this.emailService.sendTemplateEmail(to, 'Campaign Submitted - Myngly Ads', html);
  }

  async sendCampaignApprovedEmail(to: string, name: string, campaignName: string): Promise<EmailResult> {
    const html = `
      <h2>Campaign Approved</h2>
      <p>Hi ${name},</p>
      <p>Your campaign "<strong>${campaignName}</strong>" has been approved and is now scheduled to run.</p>
    `;
    return this.emailService.sendTemplateEmail(to, 'Campaign Approved - Myngly Ads', html);
  }

  async sendCampaignRejectedEmail(to: string, name: string, campaignName: string, reason: string): Promise<EmailResult> {
    const html = `
      <h2>Campaign Rejected</h2>
      <p>Hi ${name},</p>
      <p>Your campaign "<strong>${campaignName}</strong>" was not approved.</p>
      <p>Reason: ${reason}</p>
      <p>You can edit and resubmit your campaign.</p>
    `;
    return this.emailService.sendTemplateEmail(to, 'Campaign Rejected - Myngly Ads', html);
  }

  async sendCampaignCompletedEmail(to: string, name: string, campaignName: string): Promise<EmailResult> {
    const html = `
      <h2>Campaign Completed</h2>
      <p>Hi ${name},</p>
      <p>Your campaign "<strong>${campaignName}</strong>" has completed its run.</p>
      <p>Log in to view the final performance report.</p>
    `;
    return this.emailService.sendTemplateEmail(to, 'Campaign Completed - Myngly Ads', html);
  }

  async sendCampaignPausedEmail(to: string, name: string, campaignName: string): Promise<EmailResult> {
    const html = `
      <h2>Campaign Paused</h2>
      <p>Hi ${name},</p>
      <p>Your campaign "<strong>${campaignName}</strong>" has been paused.</p>
      <p>You can resume it at any time from your dashboard.</p>
    `;
    return this.emailService.sendTemplateEmail(to, 'Campaign Paused - Myngly Ads', html);
  }

  async sendBudgetAlertEmail(to: string, name: string, campaignName: string, percentUsed: number): Promise<EmailResult> {
    const html = `
      <h2>Budget Alert</h2>
      <p>Hi ${name},</p>
      <p>Your campaign "<strong>${campaignName}</strong>" has used <strong>${percentUsed}%</strong> of its budget.</p>
      <p>Consider increasing the budget to keep your campaign running.</p>
    `;
    return this.emailService.sendTemplateEmail(to, 'Budget Alert - Myngly Ads', html);
  }

  async sendWeeklyReportEmail(to: string, name: string, reportHtml: string): Promise<EmailResult> {
    const html = `
      <h2>Weekly Campaign Report</h2>
      <p>Hi ${name},</p>
      ${reportHtml}
    `;
    return this.emailService.sendTemplateEmail(to, 'Weekly Report - Myngly Ads', html);
  }

  async sendBillingReminderEmail(to: string, name: string, amount: string, dueDate: string): Promise<EmailResult> {
    const html = `
      <h2>Billing Reminder</h2>
      <p>Hi ${name},</p>
      <p>You have an upcoming payment of <strong>${amount}</strong> due on <strong>${dueDate}</strong>.</p>
      <p>Please ensure your payment method is up to date.</p>
    `;
    return this.emailService.sendTemplateEmail(to, 'Billing Reminder - Myngly Ads', html);
  }

  async sendPaymentConfirmationEmail(to: string, name: string, amount: string, transactionId: string): Promise<EmailResult> {
    const html = `
      <h2>Payment Confirmation</h2>
      <p>Hi ${name},</p>
      <p>We've received your payment of <strong>${amount}</strong>.</p>
      <p>Transaction ID: ${transactionId}</p>
    `;
    return this.emailService.sendTemplateEmail(to, 'Payment Confirmation - Myngly Ads', html);
  }

  async sendRefundProcessedEmail(to: string, name: string, amount: string, reason: string): Promise<EmailResult> {
    const html = `
      <h2>Refund Processed</h2>
      <p>Hi ${name},</p>
      <p>A refund of <strong>${amount}</strong> has been processed to your account.</p>
      <p>Reason: ${reason}</p>
      <p>The refund may take 5-10 business days to appear on your statement.</p>
    `;
    return this.emailService.sendTemplateEmail(to, 'Refund Processed - Myngly Ads', html);
  }
}
