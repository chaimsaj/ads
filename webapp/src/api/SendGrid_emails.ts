import { apiClient } from './client';

// =====================================================
// TYPES
// =====================================================

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailPreferences {
  marketing: boolean;
  campaignUpdates: boolean;
  weeklyReports: boolean;
  paymentAlerts: boolean;
  securityAlerts: boolean;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface RequestPasswordResetRequest {
  email: string;
}

export interface ContactSupportRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: 'general' | 'billing' | 'technical' | 'campaign' | 'other';
}

// =====================================================
// API FUNCTIONS
// =====================================================

export const sendGridEmailsApi = {
  /**
   * Resend email verification code
   */
  resendVerificationEmail: async (data: ResendVerificationRequest): Promise<EmailResult> => {
    return apiClient.post<EmailResult>('/auth/resend-verification', data);
  },

  /**
   * Request password reset email
   */
  requestPasswordReset: async (data: RequestPasswordResetRequest): Promise<EmailResult> => {
    return apiClient.post<EmailResult>('/auth/forgot-password', data);
  },

  /**
   * Get user's email notification preferences
   */
  getEmailPreferences: async (): Promise<EmailPreferences> => {
    return apiClient.post<EmailPreferences>('/user/email-preferences/get');
  },

  /**
   * Update user's email notification preferences
   */
  updateEmailPreferences: async (preferences: Partial<EmailPreferences>): Promise<EmailPreferences> => {
    return apiClient.post<EmailPreferences>('/user/email-preferences/update', preferences);
  },

  /**
   * Contact support via email
   */
  contactSupport: async (data: ContactSupportRequest): Promise<EmailResult> => {
    return apiClient.post<EmailResult>('/support/contact', data);
  },

  /**
   * Subscribe to newsletter
   */
  subscribeNewsletter: async (email: string): Promise<EmailResult> => {
    return apiClient.post<EmailResult>('/newsletter/subscribe', { email });
  },

  /**
   * Unsubscribe from newsletter
   */
  unsubscribeNewsletter: async (email: string, token: string): Promise<EmailResult> => {
    return apiClient.post<EmailResult>('/newsletter/unsubscribe', { email, token });
  },

  /**
   * Request campaign report email
   */
  requestCampaignReport: async (campaignId: string): Promise<EmailResult> => {
    return apiClient.post<EmailResult>('/campaigns/send-report', { id: campaignId });
  },

  /**
   * Request invoice email
   */
  requestInvoiceEmail: async (invoiceId: string): Promise<EmailResult> => {
    return apiClient.post<EmailResult>('/invoices/send-email', { id: invoiceId });
  },
};

export default sendGridEmailsApi;
