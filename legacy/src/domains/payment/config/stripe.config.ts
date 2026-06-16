import Stripe from 'stripe';

import { getEnv } from '../../../config/environment';

let _stripe: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!_stripe) {
    const env = getEnv();
    const secretKey = env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    _stripe = new Stripe(secretKey, {
      apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
      typescript: true,
    });
  }

  return _stripe;
}

export function getStripeWebhookSecret(): string {
  const env = getEnv();
  const secret = env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }

  return secret;
}

export function isStripeConfigured(): boolean {
  const env = getEnv();
  return !!env.STRIPE_SECRET_KEY;
}

export const STRIPE_METADATA_KEYS = {
  userId: 'myngly_user_id',
  campaignId: 'myngly_campaign_id',
  platform: 'myngly_ads_platform',
} as const;
