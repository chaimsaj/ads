import type { AuditLog } from '@prisma/client';

import type { IAuditLogRepository } from '../../identity/interfaces/audit-log-repository.interface';
import type { AuditLogFilters, PaginatedResult, PaginationParams } from '../types/administration.types';

export interface IAdminAuditLogRepository extends IAuditLogRepository {
  findMany(
    filters: AuditLogFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<AuditLog>>;
  findById(id: string): Promise<AuditLog | null>;
  count(filters: AuditLogFilters): Promise<number>;
}
