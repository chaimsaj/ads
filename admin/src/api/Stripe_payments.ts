import { apiClient } from './client';

// =====================================================
// TYPES – what the frontend component uses
// =====================================================

export interface StripeBalance {
  available: Array<{ amount: number; currency: string }>;
  pending: Array<{ amount: number; currency: string }>;
}

export interface StripePaymentStats {
  totalRevenue: number;
  totalTransactions: number;
  successfulPayments: number;
  failedPayments: number;
  refundedAmount: number;
  averageTransactionValue: number;
  periodComparison: {
    revenueGrowth: number;
    transactionGrowth: number;
  };
}

export interface StripeTransaction {
  id: string;
  stripePaymentIntentId: string;
  userId: string;
  campaignId?: string;
  type: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  amount: number;
  currency: string;
  description?: string;
  createdAt: string;
}

export interface StripeDispute {
  id: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
  reason: string;
  evidenceDueBy?: string;
  createdAt: string;
}

export interface StripeRefund {
  id: string;
  amount: number;
  currency: string;
  status: string;
  reason?: string | null;
  createdAt: string;
}

// =====================================================
// RAW BACKEND / STRIPE SHAPES
// =====================================================

/** Raw Stripe PaymentIntent returned by GET /admin/v1/payments/transactions */
interface RawPaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  description?: string | null;
  metadata?: Record<string, string>;
  [key: string]: unknown;
}

/** Raw dispute DTO returned by GET /admin/v1/payments/disputes */
interface RawDispute {
  id: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
  reason: string;
  evidenceDueBy?: string;
  createdAt: string;
}

/** Raw Stripe Refund returned by POST /admin/v1/payments/refunds */
interface RawStripeRefund {
  id: string;
  amount: number;
  currency: string;
  status: string;
  reason?: string | null;
  created: number;
  [key: string]: unknown;
}

// =====================================================
// MAPPERS
// =====================================================

function mapStripeStatus(status: string): StripeTransaction['status'] {
  switch (status) {
    case 'succeeded':
      return 'completed';
    case 'canceled':
    case 'requires_payment_method':
      return 'failed';
    case 'processing':
    case 'requires_action':
    case 'requires_confirmation':
    case 'requires_capture':
      return 'pending';
    default:
      return 'pending';
  }
}

function mapPaymentIntent(pi: RawPaymentIntent): StripeTransaction {
  return {
    id: pi.id,
    stripePaymentIntentId: pi.id,
    userId: pi.metadata?.userId ?? '',
    campaignId: pi.metadata?.campaignId ?? undefined,
    type: pi.description ?? 'charge',
    status: mapStripeStatus(pi.status),
    amount: pi.amount,
    currency: pi.currency,
    description: pi.description ?? undefined,
    createdAt: new Date(pi.created * 1000).toISOString(),
  };
}

function mapDispute(d: RawDispute): StripeDispute {
  return {
    id: d.id,
    paymentIntentId: d.paymentIntentId,
    amount: d.amount,
    currency: d.currency,
    status: d.status,
    reason: d.reason,
    evidenceDueBy: d.evidenceDueBy,
    createdAt: d.createdAt,
  };
}

function mapRefund(r: RawStripeRefund): StripeRefund {
  return {
    id: r.id,
    amount: r.amount,
    currency: r.currency,
    status: r.status,
    reason: r.reason,
    createdAt: new Date(r.created * 1000).toISOString(),
  };
}

// =====================================================
// PLACEHOLDER DATA (used when Stripe is not configured)
// =====================================================

const EMPTY_BALANCE: StripeBalance = {
  available: [{ amount: 0, currency: 'usd' }],
  pending: [{ amount: 0, currency: 'usd' }],
};

const EMPTY_STATS: StripePaymentStats = {
  totalRevenue: 0,
  totalTransactions: 0,
  successfulPayments: 0,
  failedPayments: 0,
  refundedAmount: 0,
  averageTransactionValue: 0,
  periodComparison: { revenueGrowth: 0, transactionGrowth: 0 },
};

// =====================================================
// API FUNCTIONS
// =====================================================

export const stripePaymentsApi = {
  getBalance: async (): Promise<StripeBalance> => {
    try {
      const data = await apiClient.post<StripeBalance>('/payments/balance');
      if (!data || !Array.isArray(data.available)) return EMPTY_BALANCE;
      return data;
    } catch {
      return EMPTY_BALANCE;
    }
  },

  getPaymentStats: async (
    startDate: string,
    endDate: string,
  ): Promise<StripePaymentStats> => {
    try {
      const data = await apiClient.post<StripePaymentStats>('/payments/stats', {
        startDate,
        endDate,
      });
      if (!data || typeof data.totalRevenue !== 'number') return EMPTY_STATS;
      return {
        ...EMPTY_STATS,
        ...data,
        periodComparison: {
          ...EMPTY_STATS.periodComparison,
          ...(data.periodComparison ?? {}),
        },
      };
    } catch {
      return EMPTY_STATS;
    }
  },

  listTransactions: async (params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<StripeTransaction[]> => {
    try {
      const raw = await apiClient.post<RawPaymentIntent[]>(
        '/payments/transactions',
        params ?? {},
      );
      if (!Array.isArray(raw)) return [];
      return raw.map(mapPaymentIntent);
    } catch {
      return [];
    }
  },

  createRefund: async (data: {
    paymentIntentId: string;
    amount?: number;
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  }): Promise<StripeRefund> => {
    const raw = await apiClient.post<RawStripeRefund>('/payments/refunds', data);
    return mapRefund(raw);
  },

  listDisputes: async (params?: {
    limit?: number;
    status?: string;
  }): Promise<StripeDispute[]> => {
    try {
      const raw = await apiClient.post<RawDispute[]>('/payments/disputes', params ?? {});
      if (!Array.isArray(raw)) return [];
      return raw.map(mapDispute);
    } catch {
      return [];
    }
  },
};

export default stripePaymentsApi;
