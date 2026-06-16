import type { Request, Response, NextFunction } from 'express';
import type Stripe from 'stripe';

import { isStripeConfigured } from '../config/stripe.config';

export interface StripeWebhookRequest extends Request {
  rawBody?: Buffer;
  stripeEvent?: Stripe.Event;
}

export function requireStripeConfig(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!isStripeConfigured()) {
    res.status(503).json({
      success: false,
      error: 'Stripe is not configured',
    });
    return;
  }
  next();
}
