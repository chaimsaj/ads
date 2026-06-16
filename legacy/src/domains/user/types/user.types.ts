import type { UserStatus, UserRole } from '@prisma/client';

// ---- User Profile DTOs ----

export interface UserProfileDTO {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly company: string | null;
  readonly avatar: string | null;
  readonly status: string;
  readonly role: string;
  readonly emailVerified: boolean;
  readonly lastLoginAt: Date | null;
  readonly createdAt: Date;
}

export interface UpdateProfileData {
  readonly name?: string;
  readonly phone?: string | null;
  readonly company?: string | null;
}

export interface UserSearchResultDTO {
  readonly id: string;
  readonly name: string;
  readonly company: string | null;
  readonly avatar: string | null;
}

// ---- Notification Setting DTOs ----

export interface NotificationSettingDTO {
  readonly emailCampaignUpdates: boolean;
  readonly emailWeeklyReports: boolean;
  readonly emailBillingAlerts: boolean;
  readonly emailProductNews: boolean;
  readonly pushCampaignUpdates: boolean;
  readonly pushBillingAlerts: boolean;
}

export interface UpdateNotificationSettingData {
  readonly emailCampaignUpdates?: boolean;
  readonly emailWeeklyReports?: boolean;
  readonly emailBillingAlerts?: boolean;
  readonly emailProductNews?: boolean;
  readonly pushCampaignUpdates?: boolean;
  readonly pushBillingAlerts?: boolean;
}

// ---- Admin User Management DTOs ----

export interface AdminUserDTO {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly company: string | null;
  readonly avatar: string | null;
  readonly status: string;
  readonly role: string;
  readonly emailVerified: boolean;
  readonly campaignsCount: number;
  readonly totalSpent: number;
  readonly lastLoginAt: Date | null;
  readonly createdAt: Date;
}

export interface AdminUserDetailDTO extends AdminUserDTO {
  readonly campaigns: readonly CampaignSummaryDTO[];
  readonly transactions: readonly TransactionSummaryDTO[];
}

export interface CampaignSummaryDTO {
  readonly id: string;
  readonly name: string;
  readonly status: string;
  readonly adFormat: string;
  readonly budget: number;
  readonly spent: number;
  readonly createdAt: Date;
}

export interface TransactionSummaryDTO {
  readonly id: string;
  readonly type: string;
  readonly amount: number;
  readonly status: string;
  readonly createdAt: Date;
}

export interface AdminUpdateUserData {
  readonly name?: string;
  readonly email?: string;
  readonly phone?: string | null;
  readonly company?: string | null;
  readonly status?: UserStatus;
  readonly role?: UserRole;
}

// ---- Filters & Pagination ----

export interface UserFilters {
  readonly search?: string;
  readonly status?: UserStatus;
  readonly role?: UserRole;
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

// ---- Status Counts ----

export interface UserStatusCount {
  readonly status: string;
  readonly count: number;
}

// ---- Bulk Actions ----

export interface BulkActionResult {
  readonly successful: number;
  readonly failed: number;
  readonly errors: readonly { readonly id: string; readonly error: string }[];
}
