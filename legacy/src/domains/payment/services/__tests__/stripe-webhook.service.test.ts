import { describe, it, expect, vi, beforeEach } from 'vitest';

import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';
import { StripeWebhookService } from '../stripe-webhook.service';
import * as stripeConfig from '../../config/stripe.config';
import type { ITransactionRepository } from '../../interfaces/transaction-repository.interface';

// Mock the stripe config
vi.mock('../../config/stripe.config', () => ({
  getStripeClient: vi.fn(),
  getStripeWebhookSecret: vi.fn().mockReturnValue('whsec_test123'),
}));

// Mock the logger
vi.mock('../../../../infrastructure/logging/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('StripeWebhookService', () => {
  let service: StripeWebhookService;
  let mockStripe: {
    webhooks: {
      constructEvent: ReturnType<typeof vi.fn>;
    };
    events: {
      retrieve: ReturnType<typeof vi.fn>;
      list: ReturnType<typeof vi.fn>;
    };
  };
  let mockTransactionRepo: Partial<ITransactionRepository>;

  const mockEvent = {
    id: 'evt_123',
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: 'pi_123',
        amount: 5000,
        currency: 'usd',
        metadata: { myngly_user_id: mockObjectId(1) },
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockStripe = {
      webhooks: {
        constructEvent: vi.fn(),
      },
      events: {
        retrieve: vi.fn(),
        list: vi.fn(),
      },
    };

    mockTransactionRepo = {
      findByStripePaymentIntentId: vi.fn(),
      updateStatus: vi.fn(),
    };

    vi.mocked(stripeConfig.getStripeClient).mockReturnValue(mockStripe as unknown as ReturnType<typeof stripeConfig.getStripeClient>);

    service = new StripeWebhookService(mockTransactionRepo as ITransactionRepository);
  });

  describe('constructEvent', () => {
    it('should construct event successfully', () => {
      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const result = service.constructEvent(
        Buffer.from('raw body'),
        'sig_test',
      );

      expect(result).toEqual(mockEvent);
    });

    it('should call constructEvent with correct parameters', () => {
      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      service.constructEvent(Buffer.from('raw body'), 'sig_test');

      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        Buffer.from('raw body'),
        'sig_test',
        'whsec_test123',
      );
    });

    it('should return null on signature verification failure', () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const result = service.constructEvent(
        Buffer.from('raw body'),
        'invalid_sig',
      );

      expect(result).toBeNull();
    });
  });

  describe('processEvent', () => {
    describe('payment_intent.succeeded', () => {
      it('should process payment_intent.succeeded event', async () => {
        vi.mocked(mockTransactionRepo.findByStripePaymentIntentId!).mockResolvedValue({
          id: 'tx_123',
          status: 'PENDING',
        });
        vi.mocked(mockTransactionRepo.updateStatus!).mockResolvedValue({});

        const result = await service.processEvent(mockEvent as any);

        expect(result.handled).toBe(true);
        expect(result.eventType).toBe('payment_intent.succeeded');
        expect(result.message).toContain('pi_123');
      });

      it('should update transaction status to COMPLETED', async () => {
        vi.mocked(mockTransactionRepo.findByStripePaymentIntentId!).mockResolvedValue({
          id: 'tx_123',
          status: 'PENDING',
        });

        await service.processEvent(mockEvent as any);

        expect(mockTransactionRepo.updateStatus).toHaveBeenCalledWith('tx_123', 'COMPLETED');
      });

      it('should not update if transaction not found', async () => {
        vi.mocked(mockTransactionRepo.findByStripePaymentIntentId!).mockResolvedValue(null);

        await service.processEvent(mockEvent as any);

        expect(mockTransactionRepo.updateStatus).not.toHaveBeenCalled();
      });
    });

    describe('payment_intent.payment_failed', () => {
      const failedEvent = {
        id: 'evt_456',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_456',
            last_payment_error: { message: 'Card declined' },
          },
        },
      };

      it('should process payment_intent.payment_failed event', async () => {
        vi.mocked(mockTransactionRepo.findByStripePaymentIntentId!).mockResolvedValue({
          id: 'tx_123',
          status: 'PENDING',
        });

        const result = await service.processEvent(failedEvent as any);

        expect(result.handled).toBe(true);
        expect(result.eventType).toBe('payment_intent.payment_failed');
      });

      it('should update transaction status to FAILED with reason', async () => {
        vi.mocked(mockTransactionRepo.findByStripePaymentIntentId!).mockResolvedValue({
          id: 'tx_123',
          status: 'PENDING',
        });

        await service.processEvent(failedEvent as any);

        expect(mockTransactionRepo.updateStatus).toHaveBeenCalledWith(
          'tx_123',
          'FAILED',
          'Card declined',
        );
      });

      it('should use default message when no error message', async () => {
        const eventWithoutError = {
          ...failedEvent,
          data: {
            object: { id: 'pi_456' },
          },
        };

        vi.mocked(mockTransactionRepo.findByStripePaymentIntentId!).mockResolvedValue({
          id: 'tx_123',
          status: 'PENDING',
        });

        await service.processEvent(eventWithoutError as any);

        expect(mockTransactionRepo.updateStatus).toHaveBeenCalledWith(
          'tx_123',
          'FAILED',
          'Payment failed',
        );
      });
    });

    describe('charge.refunded', () => {
      const refundEvent = {
        id: 'evt_789',
        type: 'charge.refunded',
        data: {
          object: { id: 'ch_123' },
        },
      };

      it('should process charge.refunded event', async () => {
        const result = await service.processEvent(refundEvent as any);

        expect(result.handled).toBe(true);
        expect(result.eventType).toBe('charge.refunded');
        expect(result.message).toContain('ch_123');
      });
    });

    describe('charge.dispute.created', () => {
      const disputeEvent = {
        id: 'evt_dispute',
        type: 'charge.dispute.created',
        data: {
          object: { id: 'dp_123' },
        },
      };

      it('should process charge.dispute.created event', async () => {
        const result = await service.processEvent(disputeEvent as any);

        expect(result.handled).toBe(true);
        expect(result.eventType).toBe('charge.dispute.created');
        expect(result.message).toContain('dp_123');
      });
    });

    describe('invoice.paid', () => {
      const invoicePaidEvent = {
        id: 'evt_inv_paid',
        type: 'invoice.paid',
        data: {
          object: { id: 'in_123' },
        },
      };

      it('should process invoice.paid event', async () => {
        const result = await service.processEvent(invoicePaidEvent as any);

        expect(result.handled).toBe(true);
        expect(result.eventType).toBe('invoice.paid');
        expect(result.message).toContain('in_123');
      });
    });

    describe('invoice.payment_failed', () => {
      const invoiceFailedEvent = {
        id: 'evt_inv_failed',
        type: 'invoice.payment_failed',
        data: {
          object: { id: 'in_456' },
        },
      };

      it('should process invoice.payment_failed event', async () => {
        const result = await service.processEvent(invoiceFailedEvent as any);

        expect(result.handled).toBe(true);
        expect(result.eventType).toBe('invoice.payment_failed');
        expect(result.message).toContain('in_456');
      });
    });

    describe('unhandled events', () => {
      it('should return unhandled for unknown event types', async () => {
        const unknownEvent = {
          id: 'evt_unknown',
          type: 'unknown.event.type',
          data: { object: {} },
        };

        const result = await service.processEvent(unknownEvent as any);

        expect(result.handled).toBe(false);
        expect(result.message).toContain('No handler');
      });
    });

    describe('error handling', () => {
      it('should handle handler errors gracefully', async () => {
        vi.mocked(mockTransactionRepo.findByStripePaymentIntentId!).mockRejectedValue(
          new Error('Database error'),
        );

        const result = await service.processEvent(mockEvent as any);

        expect(result.handled).toBe(false);
        expect(result.message).toContain('Database error');
      });
    });
  });

  describe('retrieveEvent', () => {
    it('should retrieve event successfully', async () => {
      mockStripe.events.retrieve.mockResolvedValue(mockEvent);

      const result = await service.retrieveEvent('evt_123');

      expect(result).toEqual(mockEvent);
    });

    it('should return null on error', async () => {
      mockStripe.events.retrieve.mockRejectedValue(new Error('Not found'));

      const result = await service.retrieveEvent('evt_invalid');

      expect(result).toBeNull();
    });
  });

  describe('listRecentEvents', () => {
    const mockEventsList = {
      data: [mockEvent, { ...mockEvent, id: 'evt_456' }],
    };

    it('should list recent events successfully', async () => {
      mockStripe.events.list.mockResolvedValue(mockEventsList);

      const result = await service.listRecentEvents();

      expect(result).toEqual(mockEventsList.data);
    });

    it('should use default limit of 20', async () => {
      mockStripe.events.list.mockResolvedValue(mockEventsList);

      await service.listRecentEvents();

      expect(mockStripe.events.list).toHaveBeenCalledWith({ limit: 20 });
    });

    it('should use custom limit when provided', async () => {
      mockStripe.events.list.mockResolvedValue(mockEventsList);

      await service.listRecentEvents(50);

      expect(mockStripe.events.list).toHaveBeenCalledWith({ limit: 50 });
    });

    it('should return empty array on error', async () => {
      mockStripe.events.list.mockRejectedValue(new Error('API error'));

      const result = await service.listRecentEvents();

      expect(result).toEqual([]);
    });
  });
});
