// ---- Payment Method DTOs ----

export interface PaymentMethodDTO {
  readonly id: string;
  readonly cardType: string;
  readonly lastFour: string;
  readonly expiryMonth: number;
  readonly expiryYear: number;
  readonly cardholderName: string;
  readonly isDefault: boolean;
  readonly stripePaymentMethodId: string | null;
  readonly createdAt: Date;
}

export interface CreatePaymentMethodData {
  readonly userId: string;
  readonly cardType: string;
  readonly lastFour: string;
  readonly expiryMonth: number;
  readonly expiryYear: number;
  readonly cardholderName: string;
  readonly isDefault?: boolean;
  readonly stripePaymentMethodId?: string;
  readonly stripeCustomerId?: string;
}

// ---- Transaction DTOs ----

export interface TransactionDTO {
  readonly id: string;
  readonly userId: string;
  readonly campaignId: string | null;
  readonly paymentMethodId: string | null;
  readonly type: string;
  readonly amount: number;
  readonly currency: string;
  readonly status: string;
  readonly stripePaymentIntentId: string | null;
  readonly stripeChargeId: string | null;
  readonly description: string | null;
  readonly failureReason: string | null;
  readonly createdAt: Date;
}

export interface CreateTransactionData {
  readonly userId: string;
  readonly campaignId?: string;
  readonly paymentMethodId?: string;
  readonly type: 'CHARGE' | 'REFUND' | 'CREDIT' | 'ADJUSTMENT';
  readonly amount: number;
  readonly currency?: string;
  readonly status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  readonly stripePaymentIntentId?: string;
  readonly stripeChargeId?: string;
  readonly description?: string;
  readonly failureReason?: string;
  readonly metadata?: Record<string, unknown>;
}

// ---- Transaction Filters ----

export interface TransactionFilters {
  readonly userId?: string;
  readonly campaignId?: string;
  readonly type?: string;
  readonly status?: string;
  readonly dateFrom?: Date;
  readonly dateTo?: Date;
}

export interface PaginationParams {
  readonly page: number;
  readonly limit: number;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  readonly data: readonly T[];
  readonly meta: {
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    readonly totalPages: number;
  };
}
