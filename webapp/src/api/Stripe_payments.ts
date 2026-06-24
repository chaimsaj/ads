import { apiClient } from './client';

// =====================================================
// TYPES
// =====================================================

export interface PaymentMethod {
  id: string;
  stripePaymentMethodId: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
  createdAt: string;
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface CreatePaymentIntentRequest {
  amount: number;
  currency?: string;
  campaignId?: string;
  description?: string;
  paymentMethodId?: string;
}

export interface ConfirmPaymentRequest {
  paymentMethodId: string;
  returnUrl?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'refunded';
  type: 'payment' | 'refund';
  description?: string;
  campaignId?: string;
  campaignName?: string;
  paymentMethod?: {
    brand: string;
    last4: string;
  };
  createdAt: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  dueDate?: string;
  paidAt?: string;
  invoiceUrl?: string;
  invoicePdfUrl?: string;
  createdAt: string;
}

export interface InvoicesResponse {
  invoices: Invoice[];
  total: number;
  page: number;
  limit: number;
}

// =====================================================
// BACKEND SHAPES
// =====================================================

interface BackendPaymentMethodDTO {
  id: string;
  cardType: string;
  lastFour: string;
  expiryMonth: number;
  expiryYear: number;
  cardholderName: string;
  isDefault: boolean;
  stripePaymentMethodId: string;
  createdAt: string;
}

function mapPaymentMethod(dto: BackendPaymentMethodDTO): PaymentMethod {
  return {
    id: dto.id,
    stripePaymentMethodId: dto.stripePaymentMethodId,
    type: 'card',
    card: {
      brand: dto.cardType || 'Card',
      last4: dto.lastFour || '****',
      expMonth: dto.expiryMonth,
      expYear: dto.expiryYear,
    },
    isDefault: dto.isDefault,
    createdAt: dto.createdAt,
  };
}

// =====================================================
// API FUNCTIONS
// =====================================================

export const stripePaymentsApi = {
  // =====================================================
  // PAYMENT METHODS
  // =====================================================

  /**
   * Get all saved payment methods
   */
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    const raw = await apiClient.post<BackendPaymentMethodDTO[]>('/user/payment-methods/list');
    if (Array.isArray(raw)) {
      return raw.map(mapPaymentMethod);
    }
    return [];
  },

  /**
   * Remove a payment method
   */
  removePaymentMethod: async (paymentMethodId: string): Promise<void> => {
    await apiClient.post<void>('/user/payment-methods/delete', { id: paymentMethodId });
  },

  /**
   * Set a payment method as default
   */
  setDefaultPaymentMethod: async (paymentMethodId: string): Promise<PaymentMethod> => {
    return apiClient.post<PaymentMethod>('/user/payment-methods/set-default', { id: paymentMethodId });
  },

  // =====================================================
  // PAYMENTS
  // =====================================================

  /**
   * Create a payment intent for a campaign
   */
  createPaymentIntent: async (data: CreatePaymentIntentRequest): Promise<PaymentIntent> => {
    return apiClient.post<PaymentIntent>('/stripe/payment-intents/create', data);
  },

  /**
   * Confirm a payment intent
   */
  confirmPayment: async (paymentIntentId: string, data: ConfirmPaymentRequest): Promise<PaymentIntent> => {
    return apiClient.post<PaymentIntent>('/stripe/payments/confirm', {
      paymentIntentId,
      paymentMethodId: data.paymentMethodId,
    });
  },

  // =====================================================
  // TRANSACTIONS
  // =====================================================

  /**
   * Get user's transaction history
   * Note: backend may return a raw array or an already-shaped response
   */
  getTransactions: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<TransactionsResponse> => {
    const raw = await apiClient.post<Transaction[] | TransactionsResponse>(
      '/stripe/transactions/list',
      params ?? {},
    );
    // Backend may return a raw array or an already-shaped response
    if (Array.isArray(raw)) {
      return {
        transactions: raw,
        total: raw.length,
        page: params?.page ?? 1,
        limit: params?.limit ?? raw.length,
      };
    }
    return raw;
  },

  /**
   * Get a specific transaction
   */
  getTransaction: async (transactionId: string): Promise<Transaction> => {
    return apiClient.post<Transaction>('/stripe/transactions/get', { id: transactionId });
  },

  // =====================================================
  // INVOICES
  // =====================================================

  /**
   * Get user's invoices
   * Note: backend may return a raw array or an already-shaped response
   */
  getInvoices: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<InvoicesResponse> => {
    const raw = await apiClient.post<Invoice[] | InvoicesResponse>(
      '/stripe/invoices/list',
      params ?? {},
    );
    // Backend may return a raw array or an already-shaped response
    if (Array.isArray(raw)) {
      return {
        invoices: raw,
        total: raw.length,
        page: params?.page ?? 1,
        limit: params?.limit ?? raw.length,
      };
    }
    return raw;
  },

  /**
   * Get a specific invoice.
   * Note: the API has no single-invoice endpoint, so this lists invoices and
   * selects the matching one client-side. Replace with a dedicated `get`
   * action once the backend exposes one.
   */
  getInvoice: async (invoiceId: string): Promise<Invoice> => {
    const { invoices } = await stripePaymentsApi.getInvoices();
    const invoice = invoices.find((i) => i.id === invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    return invoice;
  },

  /**
   * Download invoice PDF
   */
  downloadInvoice: async (invoiceId: string): Promise<{ url: string }> => {
    return apiClient.post<{ url: string }>('/stripe/invoices/download', { id: invoiceId });
  },

  // =====================================================
  // CHECKOUT SESSIONS
  // =====================================================

  /**
   * Create a Stripe Checkout Session in setup mode for adding payment methods.
   * Returns a URL to redirect the user to Stripe's hosted page.
   */
  createCheckoutSessionSetup: async (params?: {
    successUrl?: string;
    cancelUrl?: string;
  }): Promise<{ url: string; sessionId: string }> => {
    return apiClient.post<{ url: string; sessionId: string }>(
      '/stripe/checkout-sessions/setup',
      params ?? {},
    );
  },

  /**
   * Process a completed Checkout Session: saves the payment method to the
   * database and sets it as the user's default. Idempotent.
   */
  processCheckoutSession: async (sessionId: string): Promise<BackendPaymentMethodDTO> => {
    return apiClient.post<BackendPaymentMethodDTO>('/stripe/checkout-sessions/process', { sessionId });
  },
};

export default stripePaymentsApi;
