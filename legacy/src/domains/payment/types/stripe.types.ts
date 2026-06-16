// ---- Stripe Customer ----

export interface StripeCustomerData {
  readonly userId: string;
  readonly email: string;
  readonly name: string;
  readonly phone?: string;
  readonly metadata?: Record<string, string>;
}

// ---- Stripe Payment Intent ----

export interface CreatePaymentIntentData {
  readonly customerId: string;
  readonly amount: number;
  readonly currency?: string;
  readonly paymentMethodId?: string;
  readonly description?: string;
  readonly metadata?: Record<string, string>;
  readonly savePaymentMethod?: boolean;
}

export interface ConfirmPaymentData {
  readonly paymentIntentId: string;
  readonly paymentMethodId?: string;
}

// ---- Stripe Invoice ----

export interface CreateInvoiceData {
  readonly customerId: string;
  readonly items: readonly {
    readonly description: string;
    readonly amount: number;
    readonly quantity?: number;
  }[];
  readonly daysUntilDue?: number;
  readonly autoAdvance?: boolean;
  readonly collectionMethod?: 'charge_automatically' | 'send_invoice';
  readonly metadata?: Record<string, string>;
}

// ---- Stripe Refund ----

export interface CreateRefundData {
  readonly paymentIntentId: string;
  readonly amount?: number;
  readonly reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  readonly metadata?: Record<string, string>;
}

// ---- Stripe Admin Stats ----

export interface StripePaymentStats {
  readonly totalRevenue: number;
  readonly totalTransactions: number;
  readonly successfulPayments: number;
  readonly failedPayments: number;
  readonly refundedAmount: number;
  readonly averageTransactionValue: number;
  readonly periodComparison: {
    readonly revenueGrowth: number;
    readonly transactionGrowth: number;
  };
}

export interface StripeBalanceInfo {
  readonly available: readonly {
    readonly amount: number;
    readonly currency: string;
  }[];
  readonly pending: readonly {
    readonly amount: number;
    readonly currency: string;
  }[];
}

export interface DisputeInfo {
  readonly id: string;
  readonly paymentIntentId: string;
  readonly amount: number;
  readonly currency: string;
  readonly status: string;
  readonly reason: string;
  readonly evidenceDueBy?: string;
  readonly createdAt: string;
}

// ---- Webhook ----

export type WebhookEventType =
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'payment_intent.canceled'
  | 'charge.refunded'
  | 'charge.dispute.created'
  | 'charge.dispute.closed'
  | 'customer.created'
  | 'customer.updated'
  | 'invoice.paid'
  | 'invoice.payment_failed'
  | 'payment_method.attached'
  | 'payment_method.detached'
  | 'setup_intent.succeeded'
  | 'checkout.session.completed';

export interface WebhookEventResult {
  readonly handled: boolean;
  readonly eventType: string;
  readonly message: string;
  readonly data?: Record<string, unknown>;
}

// ---- API Response ----

export interface StripeApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly stripeErrorCode?: string;
}
