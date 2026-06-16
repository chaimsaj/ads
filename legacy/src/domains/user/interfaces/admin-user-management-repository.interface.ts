import type { User, UserStatus } from '@prisma/client';

import type { UserFilters, PaginationParams, PaginatedResult, UserStatusCount } from '../types/user.types';

export interface IAdminUserManagementRepository {
  findById(id: string): Promise<UserWithRelations | null>;
  findByEmail(email: string): Promise<User | null>;
  findMany(filters: UserFilters, pagination: PaginationParams): Promise<PaginatedResult<UserWithStats>>;
  count(filters?: UserFilters): Promise<number>;
  countByStatus(): Promise<UserStatusCount[]>;
  update(id: string, data: AdminUserUpdateData): Promise<User>;
  softDelete(id: string): Promise<void>;
  bulkUpdateStatus(ids: string[], status: UserStatus): Promise<number>;
  bulkSoftDelete(ids: string[]): Promise<number>;
  getTotalSpent(userId: string): Promise<number>;
  getNewUsersCount(since: Date): Promise<number>;
}

export interface UserWithStats extends User {
  readonly _count: {
    readonly campaigns: number;
  };
}

export interface UserWithRelations extends User {
  readonly campaigns: readonly {
    readonly id: string;
    readonly name: string;
    readonly status: string;
    readonly adFormat: string;
    readonly budget: number;
    readonly spent: number;
    readonly createdAt: Date;
  }[];
  readonly transactions: readonly {
    readonly id: string;
    readonly type: string;
    readonly amount: number;
    readonly status: string;
    readonly createdAt: Date;
  }[];
  readonly _count: {
    readonly campaigns: number;
  };
}

export interface AdminUserUpdateData {
  readonly name?: string;
  readonly email?: string;
  readonly phone?: string | null;
  readonly company?: string | null;
  readonly status?: UserStatus;
  readonly role?: string;
}
