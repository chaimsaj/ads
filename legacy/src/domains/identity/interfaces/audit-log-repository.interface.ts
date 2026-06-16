import type { AuditUserType } from '@prisma/client';

export interface IAuditLogRepository {
  create(data: CreateAuditLogData): Promise<void>;
}

export interface CreateAuditLogData {
  readonly userType: AuditUserType;
  readonly userId?: string;
  readonly action: string;
  readonly entityType?: string;
  readonly entityId?: string;
  readonly oldValues?: Record<string, unknown>;
  readonly newValues?: Record<string, unknown>;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}
