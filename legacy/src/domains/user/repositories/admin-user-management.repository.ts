import type { User, UserStatus, PrismaClient, Prisma } from '@prisma/client';

import type {
  IAdminUserManagementRepository,
  UserWithStats,
  UserWithRelations,
  AdminUserUpdateData,
} from '../interfaces/admin-user-management-repository.interface';
import type { UserFilters, PaginationParams, PaginatedResult, UserStatusCount } from '../types/user.types';

export class AdminUserManagementRepository implements IAdminUserManagementRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<UserWithRelations | null> {
    return this.db.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        campaigns: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            status: true,
            adFormat: true,
            budget: true,
            spent: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        transactions: {
          select: {
            id: true,
            type: true,
            amount: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { campaigns: { where: { deletedAt: null } } },
        },
      },
    }) as unknown as UserWithRelations | null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async findMany(
    filters: UserFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<UserWithStats>> {
    const where = this.buildWhereClause(filters);

    const [data, total] = await Promise.all([
      this.db.user.findMany({
        where,
        include: {
          _count: {
            select: { campaigns: { where: { deletedAt: null } } },
          },
        },
        orderBy: { [pagination.sortBy ?? 'createdAt']: pagination.sortOrder ?? 'desc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      this.db.user.count({ where }),
    ]);

    return {
      data: data as unknown as UserWithStats[],
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async count(filters?: UserFilters): Promise<number> {
    const where = filters ? this.buildWhereClause(filters) : { deletedAt: null };
    return this.db.user.count({ where });
  }

  async countByStatus(): Promise<UserStatusCount[]> {
    const result = await this.db.user.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: true,
    });

    return result.map((r) => ({
      status: r.status,
      count: r._count,
    }));
  }

  async update(id: string, data: AdminUserUpdateData): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.company !== undefined && { company: data.company }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.role !== undefined && { role: data.role as Prisma.EnumUserRoleFieldUpdateOperationsInput['set'] }),
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.db.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'INACTIVE',
      },
    });
  }

  async bulkUpdateStatus(ids: string[], status: UserStatus): Promise<number> {
    const result = await this.db.user.updateMany({
      where: {
        id: { in: ids },
        deletedAt: null,
      },
      data: { status },
    });
    return result.count;
  }

  async bulkSoftDelete(ids: string[]): Promise<number> {
    const result = await this.db.user.updateMany({
      where: {
        id: { in: ids },
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
        status: 'INACTIVE',
      },
    });
    return result.count;
  }

  async getTotalSpent(userId: string): Promise<number> {
    const result = await this.db.transaction.aggregate({
      where: {
        userId,
        type: 'CHARGE',
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }

  async getNewUsersCount(since: Date): Promise<number> {
    return this.db.user.count({
      where: {
        createdAt: { gte: since },
        deletedAt: null,
      },
    });
  }

  private buildWhereClause(filters: UserFilters): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { company: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        (where.createdAt as Prisma.DateTimeFilter).gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        (where.createdAt as Prisma.DateTimeFilter).lte = filters.dateTo;
      }
    }

    return where;
  }
}
