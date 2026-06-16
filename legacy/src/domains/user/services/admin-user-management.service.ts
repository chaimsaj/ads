import { mapEnum } from '../../../infrastructure/utils/enum-mapper';
import { NotFoundError, ConflictError } from '../../../infrastructure/errors';
import type { IAuditLogRepository } from '../../identity/interfaces/audit-log-repository.interface';
import type { IAdminUserManagementRepository } from '../interfaces/admin-user-management-repository.interface';
import type {
  AdminUserDTO,
  AdminUserDetailDTO,
  AdminUpdateUserData,
  UserFilters,
  PaginationParams,
  PaginatedResult,
  UserStatusCount,
  BulkActionResult,
} from '../types/user.types';

export class AdminUserManagementService {
  constructor(
    private readonly userRepo: IAdminUserManagementRepository,
    private readonly auditLogRepo: IAuditLogRepository,
  ) {}

  async listAll(
    filters: UserFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<AdminUserDTO>> {
    const result = await this.userRepo.findMany(filters, pagination);

    const usersWithSpent = await Promise.all(
      result.data.map(async (user) => {
        const totalSpent = await this.userRepo.getTotalSpent(user.id);
        return this.toAdminUserDTO(user, totalSpent);
      }),
    );

    return {
      data: usersWithSpent,
      meta: result.meta,
    };
  }

  async getById(id: string): Promise<AdminUserDetailDTO> {
    const user = await this.userRepo.findById(id);

    if (!user) {
      throw new NotFoundError('User');
    }

    const totalSpent = await this.userRepo.getTotalSpent(id);
    const baseDTO = this.toAdminUserDTO(
      { ...user, _count: user._count },
      totalSpent,
    );

    return {
      ...baseDTO,
      campaigns: user.campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        status: mapEnum(c.status),
        adFormat: mapEnum(c.adFormat),
        budget: Number(c.budget),
        spent: Number(c.spent),
        createdAt: c.createdAt,
      })),
      transactions: user.transactions.map((t) => ({
        id: t.id,
        type: mapEnum(t.type),
        amount: Number(t.amount),
        status: mapEnum(t.status),
        createdAt: t.createdAt,
      })),
    };
  }

  async update(
    id: string,
    data: AdminUpdateUserData,
    adminId: string,
    ipAddress: string,
    userAgent?: string,
  ): Promise<AdminUserDTO> {
    const existingUser = await this.userRepo.findById(id);

    if (!existingUser) {
      throw new NotFoundError('User');
    }

    if (data.email && data.email !== existingUser.email) {
      const userWithEmail = await this.userRepo.findByEmail(data.email);
      if (userWithEmail) {
        throw new ConflictError('Email already in use');
      }
    }

    await this.userRepo.update(id, data);

    await this.auditLogRepo.create({
      userType: 'ADMIN',
      userId: adminId,
      action: 'USER_UPDATED',
      entityType: 'user',
      entityId: id,
      oldValues: {
        name: existingUser.name,
        email: existingUser.email,
        status: existingUser.status,
      },
      newValues: data as Record<string, unknown>,
      ipAddress,
      userAgent,
    });

    const totalSpent = await this.userRepo.getTotalSpent(id);
    return this.toAdminUserDTO(
      { ...existingUser, _count: existingUser._count },
      totalSpent,
    );
  }

  async updateStatus(
    id: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE',
    adminId: string,
    ipAddress: string,
    userAgent?: string,
  ): Promise<AdminUserDTO> {
    const user = await this.userRepo.findById(id);

    if (!user) {
      throw new NotFoundError('User');
    }

    await this.userRepo.update(id, { status });

    const action = status === 'SUSPENDED' ? 'USER_SUSPENDED' : 'USER_STATUS_CHANGED';

    await this.auditLogRepo.create({
      userType: 'ADMIN',
      userId: adminId,
      action,
      entityType: 'user',
      entityId: id,
      oldValues: { status: user.status },
      newValues: { status },
      ipAddress,
      userAgent,
    });

    const totalSpent = await this.userRepo.getTotalSpent(id);
    return this.toAdminUserDTO(
      { ...user, _count: user._count },
      totalSpent,
    );
  }

  async deleteUser(
    id: string,
    adminId: string,
    ipAddress: string,
    userAgent?: string,
  ): Promise<void> {
    const user = await this.userRepo.findById(id);

    if (!user) {
      throw new NotFoundError('User');
    }

    await this.userRepo.softDelete(id);

    await this.auditLogRepo.create({
      userType: 'ADMIN',
      userId: adminId,
      action: 'USER_DELETED',
      entityType: 'user',
      entityId: id,
      oldValues: { name: user.name, email: user.email },
      ipAddress,
      userAgent,
    });
  }

  async bulkUpdateStatus(
    ids: string[],
    status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE',
    adminId: string,
    ipAddress: string,
    userAgent?: string,
  ): Promise<BulkActionResult> {
    const errors: { id: string; error: string }[] = [];
    let successful = 0;

    for (const id of ids) {
      try {
        await this.updateStatus(id, status, adminId, ipAddress, userAgent);
        successful++;
      } catch (err) {
        errors.push({ id, error: (err as Error).message });
      }
    }

    return { successful, failed: errors.length, errors };
  }

  async bulkDelete(
    ids: string[],
    adminId: string,
    ipAddress: string,
    userAgent?: string,
  ): Promise<BulkActionResult> {
    const errors: { id: string; error: string }[] = [];
    let successful = 0;

    for (const id of ids) {
      try {
        await this.deleteUser(id, adminId, ipAddress, userAgent);
        successful++;
      } catch (err) {
        errors.push({ id, error: (err as Error).message });
      }
    }

    return { successful, failed: errors.length, errors };
  }

  async getStatusCounts(): Promise<UserStatusCount[]> {
    const counts = await this.userRepo.countByStatus();
    return counts.map((c) => ({ ...c, status: mapEnum(c.status) }));
  }

  private toAdminUserDTO(
    user: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      company: string | null;
      avatar: string | null;
      status: string;
      role: string;
      emailVerifiedAt: Date | null;
      lastLoginAt: Date | null;
      createdAt: Date;
      _count: { campaigns: number };
    },
    totalSpent: number,
  ): AdminUserDTO {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      company: user.company,
      avatar: user.avatar,
      status: mapEnum(user.status),
      role: mapEnum(user.role),
      emailVerified: !!user.emailVerifiedAt,
      campaignsCount: user._count.campaigns,
      totalSpent,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }
}
