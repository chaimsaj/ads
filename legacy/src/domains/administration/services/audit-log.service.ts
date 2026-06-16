import { mapEnum } from '../../../infrastructure/utils/enum-mapper';
import { NotFoundError } from '../../../infrastructure/errors';
import type { IAdminAuditLogRepository } from '../interfaces/admin-audit-log-repository.interface';
import type {
  AuditLogDTO,
  AuditLogFilters,
  PaginatedResult,
  PaginationParams,
} from '../types/administration.types';

function toAuditLogDTO(log: import('@prisma/client').AuditLog): AuditLogDTO {
  return {
    id: log.id,
    userType: mapEnum(log.userType),
    userId: log.userId,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    oldValues: log.oldValues,
    newValues: log.newValues,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    createdAt: log.createdAt,
  };
}

export class AuditLogService {
  constructor(private readonly auditLogRepo: IAdminAuditLogRepository) {}

  async list(
    filters: AuditLogFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<AuditLogDTO>> {
    const result = await this.auditLogRepo.findMany(filters, pagination);
    return {
      data: result.data.map(toAuditLogDTO),
      meta: result.meta,
    };
  }

  async getById(id: string): Promise<AuditLogDTO> {
    const log = await this.auditLogRepo.findById(id);
    if (!log) {
      throw new NotFoundError('Audit log');
    }
    return toAuditLogDTO(log);
  }
}
