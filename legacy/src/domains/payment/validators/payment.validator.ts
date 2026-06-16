import { z } from 'zod';
import { objectIdSchema } from '../../../shared/validators/objectid.validator';

export const paymentMethodIdParamSchema = z.object({
  id: objectIdSchema,
});

export const addPaymentMethodSchema = z.object({
  stripePaymentMethodId: z.string().min(1, 'Stripe payment method ID is required'),
  cardholderName: z.string().min(1, 'Cardholder name is required').max(255),
  cardType: z.string().min(1).max(20),
  lastFour: z.string().length(4, 'Last four must be 4 digits'),
  expiryMonth: z.number().int().min(1).max(12),
  expiryYear: z.number().int().min(new Date().getFullYear()),
  setAsDefault: z.boolean().optional().default(false),
});

export const createCheckoutSessionSetupSchema = z.object({
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export const checkoutSessionIdParamSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

// Stripe endpoints
export const createCustomerSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
});

export const createPaymentIntentSchema = z.object({
  amount: z.number().int().positive('Amount must be a positive integer (in cents)'),
  currency: z.string().length(3).default('usd'),
  paymentMethodId: z.string().optional(),
  description: z.string().optional(),
  savePaymentMethod: z.boolean().optional().default(false),
});

export const confirmPaymentSchema = z.object({
  paymentIntentId: z.string().min(1, 'Payment Intent ID is required'),
  paymentMethodId: z.string().optional(),
});

export const createInvoiceSchema = z.object({
  items: z
    .array(
      z.object({
        description: z.string().min(1, 'Item description is required'),
        amount: z.number().int().positive('Amount must be positive'),
        quantity: z.number().int().positive().optional().default(1),
      }),
    )
    .min(1, 'At least one invoice item is required'),
  daysUntilDue: z.number().int().min(1).max(365).optional().default(30),
  autoAdvance: z.boolean().optional().default(true),
  collectionMethod: z.enum(['charge_automatically', 'send_invoice']).optional().default('charge_automatically'),
});

export const payInvoiceSchema = z.object({
  paymentMethodId: z.string().optional(),
});

export const createRefundSchema = z.object({
  paymentIntentId: z.string().min(1, 'Payment Intent ID is required'),
  amount: z.number().int().positive().optional(),
  reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer']).optional(),
});

export const stripeIdParamSchema = z.object({
  customerId: z.string().min(1),
});

export const paymentIntentIdParamSchema = z.object({
  paymentIntentId: z.string().min(1),
});

export const invoiceIdParamSchema = z.object({
  id: z.string().min(1),
});
