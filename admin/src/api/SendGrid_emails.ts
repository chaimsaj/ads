import { apiClient } from './client';

// =====================================================
// TYPES
// =====================================================

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface BulkEmailRequest {
  to: string[];
  subject: string;
  html?: string;
  text?: string;
}

export interface BulkEmailResult {
  success: boolean;
  totalRecipients: number;
  successCount: number;
  failedCount: number;
  errors?: Array<{ email: string; error: string }>;
}

export interface EmailLogEntry {
  id: string;
  messageId?: string;
  to: string;
  toName?: string;
  from: string;
  subject: string;
  templateType?: string;
  status: 'sent' | 'failed';
  userId?: string;
  campaignId?: string;
  error?: string;
  sentAt: string;
  categories?: string[];
}

export interface EmailLogsResponse {
  logs: EmailLogEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface EmailStats {
  totalSent: number;
  totalFailed: number;
  successRate: number;
  byTemplate: Record<string, { sent: number; failed: number }>;
  byDay: Array<{ date: string; sent: number; failed: number }>;
}

// =====================================================
// FALLBACK DATA
// =====================================================

const EMPTY_STATS: EmailStats = {
  totalSent: 0,
  totalFailed: 0,
  successRate: 0,
  byTemplate: {},
  byDay: [],
};

const EMPTY_LOGS: EmailLogsResponse = {
  logs: [],
  total: 0,
  page: 1,
  limit: 50,
};

// =====================================================
// BACKEND DTO SHAPES (what the API actually returns)
// =====================================================

interface BackendEmailStatsDTO {
  totalSent: number;
  totalFailed: number;
  recentEmails?: Array<{ to: string; subject: string; status: string; sentAt: string; error?: string }>;
  byDay?: Array<{ date: string; sent: number; failed: number }>;
}

interface BackendRecentEmailDTO {
  to: string;
  subject: string;
  status: string;
  sentAt: string;
  error?: string;
}

// =====================================================
// MAPPERS
// =====================================================

function mapEmailStats(raw: BackendEmailStatsDTO): EmailStats {
  const totalSent = raw.totalSent ?? 0;
  const totalFailed = raw.totalFailed ?? 0;
  const total = totalSent + totalFailed;

  // Derive template breakdown from recent emails subjects
  const byTemplate: Record<string, { sent: number; failed: number }> = {};
  if (raw.recentEmails) {
    for (const email of raw.recentEmails) {
      const template = categorizeEmailTemplate(email.subject);
      if (!byTemplate[template]) {
        byTemplate[template] = { sent: 0, failed: 0 };
      }
      if (email.status === 'sent') {
        byTemplate[template].sent++;
      } else {
        byTemplate[template].failed++;
      }
    }
  }

  return {
    totalSent,
    totalFailed,
    successRate: total > 0 ? (totalSent / total) * 100 : 0,
    byTemplate,
    byDay: raw.byDay ?? [],
  };
}

function categorizeEmailTemplate(subject: string): string {
  const lower = (subject || '').toLowerCase();
  if (lower.includes('verify') || lower.includes('verification')) return 'Verification';
  if (lower.includes('password') || lower.includes('reset')) return 'Password Reset';
  if (lower.includes('welcome')) return 'Welcome';
  if (lower.includes('campaign')) return 'Campaign';
  if (lower.includes('invoice') || lower.includes('payment')) return 'Billing';
  return 'General';
}

function mapEmailLogs(raw: BackendRecentEmailDTO[]): EmailLogsResponse {
  const logs: EmailLogEntry[] = raw.map((e, i) => ({
    id: String(i),
    to: e.to,
    from: '',
    subject: e.subject,
    status: e.status === 'sent' ? 'sent' as const : 'failed' as const,
    sentAt: e.sentAt,
    error: e.error,
  }));
  return { logs, total: logs.length, page: 1, limit: logs.length };
}

// =====================================================
// API FUNCTIONS
// =====================================================

export const sendGridEmailsApi = {
  sendBulkEmail: async (data: BulkEmailRequest): Promise<BulkEmailResult> => {
    const raw = await apiClient.post<{ sent: number; failed: number; results: unknown[] }>('/email/bulk', data);
    return {
      success: true,
      totalRecipients: (raw.sent ?? 0) + (raw.failed ?? 0),
      successCount: raw.sent ?? 0,
      failedCount: raw.failed ?? 0,
    };
  },

  getEmailLogs: async (): Promise<EmailLogsResponse> => {
    try {
      const raw = await apiClient.post<BackendRecentEmailDTO[] | { recentEmails?: BackendRecentEmailDTO[]; logs?: BackendRecentEmailDTO[] }>('/email/recent');
      if (Array.isArray(raw)) {
        return mapEmailLogs(raw);
      }
      if (raw && 'recentEmails' in raw && Array.isArray(raw.recentEmails)) {
        return mapEmailLogs(raw.recentEmails);
      }
      if (raw && 'logs' in raw && Array.isArray(raw.logs)) {
        return mapEmailLogs(raw.logs);
      }
      return EMPTY_LOGS;
    } catch {
      return EMPTY_LOGS;
    }
  },

  getEmailStats: async (): Promise<EmailStats> => {
    try {
      const raw = await apiClient.post<BackendEmailStatsDTO>('/email/stats');
      return mapEmailStats(raw);
    } catch {
      return EMPTY_STATS;
    }
  },
};

export default sendGridEmailsApi;
