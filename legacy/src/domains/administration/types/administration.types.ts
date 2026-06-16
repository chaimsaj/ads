import type { AuditUserType } from '@prisma/client';

export interface AuditLogDTO {
  readonly id: string;
  readonly userType: string;
  readonly userId: string | null;
  readonly action: string;
  readonly entityType: string | null;
  readonly entityId: string | null;
  readonly oldValues: unknown;
  readonly newValues: unknown;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly createdAt: Date;
}

export interface AuditLogFilters {
  readonly userType?: AuditUserType;
  readonly userId?: string;
  readonly action?: string;
  readonly entityType?: string;
  readonly dateFrom?: Date;
  readonly dateTo?: Date;
}

export interface SystemSettingDTO {
  readonly id: string;
  readonly settingKey: string;
  readonly settingValue: string | null;
  readonly settingType: string;
  readonly description: string | null;
  readonly isPublic: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface SystemSettingGrouped {
  readonly [group: string]: readonly SystemSettingDTO[];
}

export interface PaginationParams {
  readonly page: number;
  readonly limit: number;
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

export interface UpdateSettingData {
  readonly key: string;
  readonly value: string | null;
}
