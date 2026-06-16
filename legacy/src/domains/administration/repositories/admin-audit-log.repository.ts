import type { AuditLog, Prisma, PrismaClient } from '@prisma/client';

import { AuditLogRepository } from '../../identity/repositories/audit-log.repository';
import type { IAdminAuditLogRepository } from '../interfaces/admin-audit-log-repository.interface';
import type { AuditLogFilters, PaginatedResult, PaginationParams } from '../types/administration.types';

export class AdminAuditLogRepository extends AuditLogRepository implements IAdminAuditLogRepository {
  constructor(private readonly prisma: PrismaClient) {
    super(prisma);
  }

  async findMany(
    filters: AuditLogFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<AuditLog>> {
    const where = buildWhereClause(filters);

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async findById(id: string): Promise<AuditLog | null> {
    return this.prisma.auditLog.findUnique({
      where: { id },
    });
  }

  async count(filters: AuditLogFilters): Promise<number> {
    return this.prisma.auditLog.count({
      where: buildWhereClause(filters),
    });
  }
}

function buildWhereClause(filters: AuditLogFilters): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};

  if (filters.userType) where.userType = filters.userType;
  if (filters.userId) where.userId = filters.userId;
  if (filters.action) where.action = { contains: filters.action };
  if (filters.entityType) where.entityType = filters.entityType;

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {
      ...(filters.dateFrom && { gte: filters.dateFrom }),
      ...(filters.dateTo && { lte: filters.dateTo }),
    };
  }

  return where;
}
