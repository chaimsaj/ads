import { describe, it, expect, vi, beforeEach } from 'vitest';

import { EmailService } from '../email.service';

// Mock the sendgrid config module
vi.mock('../../config/sendgrid.config', () => ({
  isSendGridConfigured: vi.fn().mockReturnValue(false),
  getSendGridClient: vi.fn().mockReturnValue({
    send: vi.fn().mockResolvedValue([{ statusCode: 202, headers: { 'x-message-id': 'test-123' } }]),
  }),
  getFromEmail: vi.fn().mockReturnValue({ email: 'test@myngly.com', name: 'Test' }),
}));

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EmailService();
  });

  describe('sendEmail', () => {
    it('should return failure when SendGrid is not configured', async () => {
      const result = await service.sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Hello</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email service not configured');
    });

    it('should send email when SendGrid is configured', async () => {
      const { isSendGridConfigured } = await import('../../config/sendgrid.config');
      (isSendGridConfigured as ReturnType<typeof vi.fn>).mockReturnValue(true);

      const result = await service.sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Hello</p>',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-123');
    });

    it('should handle send errors gracefully', async () => {
      const { isSendGridConfigured, getSendGridClient } = await import('../../config/sendgrid.config');
      (isSendGridConfigured as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (getSendGridClient as ReturnType<typeof vi.fn>).mockReturnValue({
        send: vi.fn().mockRejectedValue(new Error('API error')),
      });

      const result = await service.sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Hello</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('API error');
    });
  });

  describe('getStats', () => {
    it('should track email stats', async () => {
      // Send a failed email (not configured)
      await service.sendEmail({ to: 'user@example.com', subject: 'Test' });

      const stats = service.getStats();

      expect(stats.totalFailed).toBe(1);
      expect(stats.totalSent).toBe(0);
      expect(stats.recentEmails).toHaveLength(1);
      expect(stats.recentEmails[0].status).toBe('failed');
    });
  });

  describe('sendTemplateEmail', () => {
    it('should delegate to sendEmail', async () => {
      const result = await service.sendTemplateEmail('user@example.com', 'Test', '<p>Hello</p>');

      expect(result.success).toBe(false); // not configured
    });
  });
});
