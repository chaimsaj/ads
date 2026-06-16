import type { Prisma, PrismaClient } from '@prisma/client';

import type {
  IAuditLogRepository,
  CreateAuditLogData,
} from '../interfaces/audit-log-repository.interface';

export class AuditLogRepository implements IAuditLogRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: CreateAuditLogData): Promise<void> {
    await this.db.auditLog.create({
      data: {
        userType: data.userType,
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        oldValues: (data.oldValues ?? undefined) as Prisma.InputJsonValue | undefined,
        newValues: (data.newValues ?? undefined) as Prisma.InputJsonValue | undefined,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }
}
