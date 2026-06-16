import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Response, NextFunction } from 'express';

import { WebhookController } from '../webhook.controller';
import type { StripeWebhookService } from '../../services/stripe-webhook.service';
import type { StripeWebhookRequest } from '../../middleware/stripe-webhook.middleware';

// Mock the response helper module
vi.mock('../../../../infrastructure/http/response.helper', () => ({
  success: vi.fn(),
}));

// Mock the logger
vi.mock('../../../../infrastructure/logging/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import { success } from '../../../../infrastructure/http/response.helper';

describe('WebhookController', () => {
  let controller: WebhookController;
  let mockWebhookService: Partial<StripeWebhookService>;
  let mockReq: StripeWebhookRequest;
  let mockRes: Response;
  let mockNext: NextFunction;

  const mockEvent = {
    id: 'evt_123',
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: 'pi_123',
        amount: 5000,
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockWebhookService = {
      constructEvent: vi.fn(),
      processEvent: vi.fn(),
      retrieveEvent: vi.fn(),
    };

    mockReq = {
      body: {},
      params: {},
      headers: { 'stripe-signature': 'sig_123' },
      rawBody: Buffer.from('{"type":"payment_intent.succeeded"}'),
    } as unknown as StripeWebhookRequest;

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    mockNext = vi.fn();

    controller = new WebhookController(mockWebhookService as StripeWebhookService);
  });

  describe('handleWebhook', () => {
    it('should process webhook event successfully', async () => {
      vi.mocked(mockWebhookService.constructEvent!).mockReturnValue(mockEvent);
      vi.mocked(mockWebhookService.processEvent!).mockResolvedValue({ handled: true });

      await controller.handleWebhook(mockReq, mockRes, mockNext);

      expect(mockWebhookService.constructEvent).toHaveBeenCalledWith(
        mockReq.rawBody,
        'sig_123',
      );
      expect(mockWebhookService.processEvent).toHaveBeenCalledWith(mockEvent);
      expect(success).toHaveBeenCalledWith(mockRes, { received: true, handled: true });
    });

    it('should return 400 when signature is missing', async () => {
      mockReq.headers = {};

      await controller.handleWebhook(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Missing signature or body',
      });
    });

    it('should return 400 when rawBody is missing', async () => {
      mockReq.rawBody = undefined;

      await controller.handleWebhook(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Missing signature or body',
      });
    });

    it('should return 400 when event construction fails', async () => {
      vi.mocked(mockWebhookService.constructEvent!).mockReturnValue(null);

      await controller.handleWebhook(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid webhook signature',
      });
    });

    it('should call next with error on exception', async () => {
      const error = new Error('Processing failed');
      vi.mocked(mockWebhookService.constructEvent!).mockReturnValue(mockEvent);
      vi.mocked(mockWebhookService.processEvent!).mockRejectedValue(error);

      await controller.handleWebhook(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle unhandled event types', async () => {
      vi.mocked(mockWebhookService.constructEvent!).mockReturnValue(mockEvent);
      vi.mocked(mockWebhookService.processEvent!).mockResolvedValue({ handled: false });

      await controller.handleWebhook(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, { received: true, handled: false });
    });
  });

  describe('getEvent', () => {
    it('should retrieve event successfully', async () => {
      mockReq.params = { eventId: 'evt_123' };
      vi.mocked(mockWebhookService.retrieveEvent!).mockResolvedValue(mockEvent);

      await controller.getEvent(mockReq, mockRes, mockNext);

      expect(mockWebhookService.retrieveEvent).toHaveBeenCalledWith('evt_123');
      expect(success).toHaveBeenCalledWith(mockRes, mockEvent);
    });

    it('should return 404 when event not found', async () => {
      mockReq.params = { eventId: 'evt_nonexistent' };
      vi.mocked(mockWebhookService.retrieveEvent!).mockResolvedValue(null);

      await controller.getEvent(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Event not found',
      });
    });

    it('should call next with error on exception', async () => {
      mockReq.params = { eventId: 'evt_123' };
      const error = new Error('Failed to retrieve event');
      vi.mocked(mockWebhookService.retrieveEvent!).mockRejectedValue(error);

      await controller.getEvent(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('retryEvent', () => {
    it('should retry event processing successfully', async () => {
      mockReq.params = { eventId: 'evt_123' };
      vi.mocked(mockWebhookService.retrieveEvent!).mockResolvedValue(mockEvent);
      vi.mocked(mockWebhookService.processEvent!).mockResolvedValue({ handled: true, retried: true });

      await controller.retryEvent(mockReq, mockRes, mockNext);

      expect(mockWebhookService.retrieveEvent).toHaveBeenCalledWith('evt_123');
      expect(mockWebhookService.processEvent).toHaveBeenCalledWith(mockEvent);
      expect(success).toHaveBeenCalledWith(mockRes, { handled: true, retried: true });
    });

    it('should return 404 when event not found', async () => {
      mockReq.params = { eventId: 'evt_nonexistent' };
      vi.mocked(mockWebhookService.retrieveEvent!).mockResolvedValue(null);

      await controller.retryEvent(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Event not found',
      });
    });

    it('should not call processEvent when event not found', async () => {
      mockReq.params = { eventId: 'evt_nonexistent' };
      vi.mocked(mockWebhookService.retrieveEvent!).mockResolvedValue(null);

      await controller.retryEvent(mockReq, mockRes, mockNext);

      expect(mockWebhookService.processEvent).not.toHaveBeenCalled();
    });

    it('should call next with error on exception', async () => {
      mockReq.params = { eventId: 'evt_123' };
      const error = new Error('Processing failed');
      vi.mocked(mockWebhookService.retrieveEvent!).mockResolvedValue(mockEvent);
      vi.mocked(mockWebhookService.processEvent!).mockRejectedValue(error);

      await controller.retryEvent(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
