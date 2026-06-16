# Stripe Payment Integration Documentation

**Date**: January 23, 2026
**Version**: 1.0.0
**Author**: Claude Code

---

## Overview

This document describes the complete Stripe payment gateway integration for the Myngly Ads Platform. The integration supports:

- Customer management
- Payment processing (cards)
- Invoice generation and management
- Refund processing
- Webhook event handling
- Admin payment dashboard
- Payment analytics and reporting

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Admin Panel (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Payments    │  │  Invoices    │  │  Disputes    │          │
│  │  Dashboard   │  │  Management  │  │  Tracking    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Node.js API                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Controllers                               ││
│  │  Stripe_payment │ Stripe_invoice │ Stripe_admin │ webhook   ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                     Services                                 ││
│  │  customer │ payment │ invoice │ refund │ webhook │ admin    ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Stripe API                                  │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│  │Customers││Payments││Invoices││ Refunds ││Webhooks│       │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files Created

### Node.js API (`Node_API/src/`)

#### Configuration
| File | Description |
|------|-------------|
| `config/Stripe_config.ts` | Stripe client initialization, configuration constants |

#### Types
| File | Description |
|------|-------------|
| `types/Stripe_types.ts` | TypeScript interfaces for all Stripe-related data |

#### Services
| File | Description |
|------|-------------|
| `services/Stripe_customer.service.ts` | Customer creation, retrieval, setup intents |
| `services/Stripe_payment.service.ts` | Payment intents, payment methods, charges |
| `services/Stripe_invoice.service.ts` | Invoice creation, management, credits |
| `services/Stripe_refund.service.ts` | Refund processing and status tracking |
| `services/Stripe_webhook.service.ts` | Webhook event handling with registered handlers |
| `services/Stripe_admin.service.ts` | Admin statistics, balance, disputes, payouts |

#### Controllers
| File | Description |
|------|-------------|
| `controllers/Stripe_payment.controller.ts` | Payment and payment method endpoints |
| `controllers/Stripe_invoice.controller.ts` | Invoice management endpoints |
| `controllers/Stripe_webhook.controller.ts` | Webhook handling and debugging |
| `controllers/Stripe_admin.controller.ts` | Admin-only payment management |

#### Middleware
| File | Description |
|------|-------------|
| `middleware/Stripe_webhook.middleware.ts` | Webhook signature verification, rate limiting |

#### Validators
| File | Description |
|------|-------------|
| `validators/Stripe_validators.ts` | Zod schemas for input validation |

#### Routes
| File | Description |
|------|-------------|
| `routes/Stripe_routes.ts` | All Stripe API routes |

### Admin Panel (`admin/src/`)

| File | Description |
|------|-------------|
| `api/Stripe_payments.ts` | API client for Stripe admin endpoints (all paths under `/admin/v1/payments/`, not `/stripe/admin/`) |
| `pages/payments/Stripe_Payments.tsx` | Payment management dashboard page |
| `pages/payments/Stripe_Payments.module.css` | Styles for payment dashboard |
| `pages/payments/index.ts` | Module exports |

### Advertiser Webapp (`webapp/src/`)

| File | Description |
|------|-------------|
| `api/Stripe_payments.ts` | API client with `BackendPaymentMethodDTO` mapper (flat backend DTO to nested `PaymentMethod`) |
| `api/index.ts` | Updated with Stripe exports |
| `pages/campaign/Payment.tsx` | Campaign payment page with Stripe integration |
| `pages/settings/BillingMethodsModal.tsx` | Billing methods listing/deletion; add card shows Stripe Elements stub (coming soon) |

---

## Environment Configuration

Add the following to your `.env` file:

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_API_VERSION=2024-12-18.acacia
```

### Getting API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your **Secret key** → `STRIPE_SECRET_KEY`
3. Copy your **Publishable key** → `STRIPE_PUBLISHABLE_KEY`

### Setting Up Webhooks

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your endpoint URL: `https://your-domain.com/api/stripe/webhook`
4. Select events to listen for (see [Webhook Events](#webhook-events))
5. Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`

---

## API Endpoints

### Customer Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/stripe/customers` | Create or get customer |
| `GET` | `/stripe/customers/:stripeCustomerId` | Get customer details |
| `PATCH` | `/stripe/customers/:stripeCustomerId` | Update customer |
| `POST` | `/stripe/customers/:stripeCustomerId/setup-intent` | Create setup intent |
| `GET` | `/stripe/customers/:stripeCustomerId/payment-methods` | List payment methods |
| `POST` | `/stripe/customers/:stripeCustomerId/payment-methods` | Add payment method |
| `PATCH` | `/stripe/customers/:stripeCustomerId/payment-methods/:pmId/default` | Set default |
| `GET` | `/stripe/customers/:stripeCustomerId/balance` | Get balance |

### Payment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/stripe/payments/:stripeCustomerId/intents` | Create payment intent |
| `POST` | `/stripe/payments/confirm` | Confirm payment |
| `GET` | `/stripe/payments/intents/:paymentIntentId` | Get payment intent |
| `POST` | `/stripe/payments/intents/:paymentIntentId/cancel` | Cancel payment |
| `POST` | `/stripe/payments/:stripeCustomerId/charge` | Charge off-session |
| `DELETE` | `/stripe/payments/methods/:paymentMethodId` | Remove payment method |

### Invoice Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/stripe/invoices/:stripeCustomerId` | Create invoice |
| `GET` | `/stripe/invoices` | List all invoices |
| `GET` | `/stripe/invoices/customer/:stripeCustomerId` | List customer invoices |
| `GET` | `/stripe/invoices/:invoiceId` | Get invoice |
| `POST` | `/stripe/invoices/:invoiceId/finalize` | Finalize invoice |
| `POST` | `/stripe/invoices/:invoiceId/send` | Send invoice |
| `POST` | `/stripe/invoices/:invoiceId/pay` | Pay invoice |
| `POST` | `/stripe/invoices/:invoiceId/void` | Void invoice |
| `POST` | `/stripe/invoices/:invoiceId/uncollectible` | Mark uncollectible |
| `POST` | `/stripe/invoices/:stripeCustomerId/credit` | Add customer credit |

### Admin Endpoints

> **Updated 2026-02-04:** All admin payment endpoints now live under `/admin/v1/payments/` (previously `/stripe/admin/`). The admin panel API client (`admin/src/api/Stripe_payments.ts`) has been updated accordingly.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/v1/payments/balance` | Get Stripe account balance |
| `GET` | `/admin/v1/payments/stats` | Get payment statistics |
| `GET` | `/admin/v1/payments/transactions` | List transactions |
| `GET` | `/admin/v1/payments/transactions/:paymentIntentId` | Get transaction details |
| `GET` | `/admin/v1/payments/transactions/:paymentIntentId/refunds` | List refunds for a transaction |
| `GET` | `/admin/v1/payments/transactions/:paymentIntentId/refund-status` | Check refund status |
| `POST` | `/admin/v1/payments/refunds` | Create refund |
| `GET` | `/admin/v1/payments/refunds/:refundId` | Get refund |
| `GET` | `/admin/v1/payments/disputes` | List disputes |
| `GET` | `/admin/v1/payments/disputes/:disputeId` | Get dispute |
| `GET` | `/admin/v1/payments/customers/search` | Search customers |
| `GET` | `/admin/v1/payments/payouts` | List payouts |
| `GET` | `/admin/v1/payments/invoices` | List invoices |
| `GET` | `/admin/v1/payments/invoices/:invoiceId` | Get invoice |
| `POST` | `/admin/v1/payments/invoices/:invoiceId/void` | Void invoice |
| `GET` | `/admin/v1/payments/dashboard-link/:type/:id` | Get Stripe dashboard URL |
| `GET` | `/admin/v1/payments/webhooks/:eventId` | Get webhook event |
| `POST` | `/admin/v1/payments/webhooks/:eventId/retry` | Retry webhook event |

### Webhook Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/stripe/webhook` | Webhook handler (no auth) |
| `GET` | `/admin/v1/payments/webhooks/:eventId` | Get webhook event details |
| `POST` | `/admin/v1/payments/webhooks/:eventId/retry` | Retry webhook event |

---

## Webhook Events

The integration handles the following Stripe webhook events:

| Event | Handler Action |
|-------|----------------|
| `payment_intent.succeeded` | Record successful payment, update campaign |
| `payment_intent.payment_failed` | Record failed payment, notify user |
| `charge.refunded` | Update transaction record |
| `charge.dispute.created` | Alert admin, pause campaign |
| `invoice.paid` | Activate campaign, send receipt |
| `invoice.payment_failed` | Notify user, retry payment |
| `customer.created` | Log customer creation |
| `payment_method.attached` | Update user payment methods |
| `payment_method.detached` | Remove from user record |
| `setup_intent.succeeded` | Confirm new payment method |

---

## Usage Examples

### 1. Create a Customer

```typescript
// Frontend: Create customer when user registers
const response = await fetch('/api/stripe/customers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    userId: user.id,
    email: user.email,
    name: user.name,
  }),
})

const { data } = await response.json()
// data.stripeCustomerId - save this to user record
```

### 2. Add Payment Method (Frontend with Stripe.js)

```typescript
// Initialize Stripe.js
const stripe = Stripe(STRIPE_PUBLISHABLE_KEY)

// Get Setup Intent client secret from backend
const { clientSecret } = await fetch(`/api/stripe/customers/${customerId}/setup-intent`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
}).then(r => r.json())

// Confirm setup with Stripe Elements
const result = await stripe.confirmCardSetup(clientSecret, {
  payment_method: {
    card: cardElement,
    billing_details: { name: 'Card Holder Name' },
  },
})

if (result.error) {
  // Handle error
} else {
  // Payment method added successfully
}
```

### 3. Create Payment for Campaign

```typescript
// Backend: Create payment intent
const response = await fetch(`/api/stripe/payments/${stripeCustomerId}/intents`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    userId: user.id,
    campaignId: campaign.id,
    amount: 5000, // $50.00 in cents
    paymentMethodId: savedPaymentMethodId,
    description: 'Campaign: Summer Sale',
    savePaymentMethod: true,
  }),
})

const { data } = await response.json()

// If requires 3D Secure
if (data.requiresAction) {
  const { error } = await stripe.confirmCardPayment(data.clientSecret)
  if (error) {
    // Handle authentication failure
  }
}
```

### 4. Create Invoice

```typescript
const response = await fetch(`/api/stripe/invoices/${stripeCustomerId}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    userId: user.id,
    campaignId: campaign.id,
    items: [
      {
        description: 'Campaign: Summer Sale - Banner Ads',
        amount: 5000, // $50.00
        quantity: 1,
      },
      {
        description: 'Premium Boost Upgrade',
        amount: 1500, // $15.00
        quantity: 1,
      },
    ],
    daysUntilDue: 30,
    collectionMethod: 'send_invoice',
  }),
})
```

### 5. Process Refund (Admin)

```typescript
const response = await fetch('/api/admin/v1/payments/refunds', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`,
  },
  body: JSON.stringify({
    paymentIntentId: 'pi_xxxxx',
    amount: 2500, // Partial refund: $25.00
    reason: 'requested_by_customer',
  }),
})
```

---

## Security Considerations

### 1. Never Store Card Numbers
- All card data is tokenized by Stripe
- Only store Stripe customer IDs and payment method IDs
- PCI compliance is handled by Stripe

### 2. Webhook Signature Verification
- All webhook events are verified using the signing secret
- Raw body must be preserved for signature verification
- See `Stripe_webhook.middleware.ts`

### 3. Rate Limiting
- Stripe endpoints have additional rate limiting (30 req/min)
- Prevents abuse and API quota exhaustion

### 4. Idempotency
- Use idempotency keys for important operations
- Prevents duplicate charges on retries

### 5. Error Handling
- All Stripe errors are caught and normalized
- Sensitive error details are logged but not exposed to clients

---

## Testing

### Test Cards

| Number | Description |
|--------|-------------|
| `4242424242424242` | Successful payment |
| `4000000000003220` | 3D Secure required |
| `4000000000000002` | Card declined |
| `4000000000009995` | Insufficient funds |

### Test Mode vs Live Mode

- Test mode: Use `sk_test_` and `pk_test_` keys
- Live mode: Use `sk_live_` and `pk_live_` keys
- Webhooks need separate endpoints for test and live

### Testing Webhooks Locally

Use Stripe CLI:

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/api/stripe/webhook

# Trigger test events
stripe trigger payment_intent.succeeded
```

---

## Admin Dashboard Features

The admin payment dashboard (`/payments`) includes:

### Overview Tab
- Available and pending balance
- Revenue statistics with period comparison
- Transaction success/failure rates
- Refund totals

### Transactions Tab
- List all payment intents
- Filter by status, date range
- View transaction details
- Create refunds directly
- Open Stripe dashboard links

### Invoices Tab
- List all invoices
- View invoice details
- Download invoice PDFs
- Open hosted invoice pages

### Disputes Tab
- List active disputes
- View dispute details and evidence deadlines
- Direct links to Stripe dashboard

### Payouts Tab
- List bank payouts
- Track payout status and arrival dates

---

## Integrating with Routes

Add the Stripe routes to your main Express app:

```typescript
// index.ts
import express from 'express'
import stripeRoutes from './routes/Stripe_routes.js'

const app = express()

// Important: Stripe webhook needs raw body
// Configure body parsing carefully
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }))
app.use(express.json())

// Mount Stripe routes
app.use('/api/stripe', stripeRoutes)
```

---

## Next Steps

1. **Database Integration**: Connect webhook handlers to update database records
2. **Email Notifications**: Send receipts and payment failure notifications
3. **Subscription Support**: Add recurring billing for campaign subscriptions
4. **Multi-Currency**: Enable multiple currency support
5. **Connect Accounts**: Add Stripe Connect for marketplace features
6. **Reporting**: Build detailed revenue reports and analytics

---

## Troubleshooting

### Common Issues

**1. "Invalid webhook signature"**
- Ensure raw body is preserved (not parsed as JSON)
- Check webhook secret is correct
- Verify endpoint URL matches Stripe dashboard

**2. "Customer not found"**
- Customer may have been deleted in Stripe
- Use `findOrCreateCustomer` to handle this case

**3. "Payment requires authentication"**
- 3D Secure is required
- Use `confirmCardPayment` on frontend with client secret

**4. "Rate limit exceeded"**
- Too many API calls
- Implement caching for read operations
- Use webhooks instead of polling

---

## Support

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)

---

*Last updated: February 4, 2026*
