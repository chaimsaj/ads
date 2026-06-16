import type { Response, NextFunction } from 'express';

import { success } from '../../../infrastructure/http/response.helper';
import { logger } from '../../../infrastructure/logging/logger';
import type { StripeWebhookRequest } from '../middleware/stripe-webhook.middleware';
import type { StripeWebhookService } from '../services/stripe-webhook.service';

export class WebhookController {
  constructor(private readonly webhookService: StripeWebhookService) {}

  handleWebhook = async (req: StripeWebhookRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const signature = req.headers['stripe-signature'] as string;

      if (!signature || !req.rawBody) {
        res.status(400).json({ success: false, error: 'Missing signature or body' });
        return;
      }

      const event = this.webhookService.constructEvent(req.rawBody, signature);

      if (!event) {
        res.status(400).json({ success: false, error: 'Invalid webhook signature' });
        return;
      }

      const result = await this.webhookService.processEvent(event);

      logger.info('Webhook processed', {
        eventId: event.id,
        type: event.type,
        handled: result.handled,
      });

      success(res, { received: true, ...result });
    } catch (err) {
      next(err);
    }
  };

  getEvent = async (req: StripeWebhookRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const event = await this.webhookService.retrieveEvent(String(req.params.eventId));

      if (!event) {
        res.status(404).json({ success: false, error: 'Event not found' });
        return;
      }

      success(res, event);
    } catch (err) {
      next(err);
    }
  };

  retryEvent = async (req: StripeWebhookRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const event = await this.webhookService.retrieveEvent(String(req.params.eventId));

      if (!event) {
        res.status(404).json({ success: false, error: 'Event not found' });
        return;
      }

      const result = await this.webhookService.processEvent(event);
      success(res, result);
    } catch (err) {
      next(err);
    }
  };
}
