export interface EmailData {
  readonly to: string;
  readonly subject: string;
  readonly text?: string;
  readonly html?: string;
}

export interface EmailResult {
  readonly success: boolean;
  readonly messageId?: string;
  readonly error?: string;
}

export interface BulkEmailData {
  readonly to: readonly string[];
  readonly subject: string;
  readonly text?: string;
  readonly html?: string;
}

export interface EmailDayStatsDTO {
  readonly date: string;
  readonly sent: number;
  readonly failed: number;
}

export interface EmailStatsDTO {
  readonly totalSent: number;
  readonly totalFailed: number;
  readonly recentEmails: readonly RecentEmailDTO[];
  readonly byDay: readonly EmailDayStatsDTO[];
}

export interface RecentEmailDTO {
  readonly to: string;
  readonly subject: string;
  readonly status: 'sent' | 'failed';
  readonly sentAt: Date;
  readonly error?: string;
}
