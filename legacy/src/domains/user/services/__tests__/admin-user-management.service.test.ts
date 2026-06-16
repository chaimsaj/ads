import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { User, UserStatus, UserRole } from '@prisma/client';

import type {
  IAdminUserManagementRepository,
  UserWithRelations,
  UserWithStats,
} from '../../interfaces/admin-user-management-repository.interface';
import type { IAuditLogRepository } from '../../../identity/interfaces/audit-log-repository.interface';
import { AdminUserManagementService } from '../admin-user-management.service';
import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';

// ---------------------------------------------------------------------------
// Mock Factories
// ---------------------------------------------------------------------------

function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: mockObjectId(1),
    name: 'John Doe',
    email: 'john@example.com',
    password: '$2b$12$hashedpassword',
    phone: '+1234567890',
    company: 'Acme Inc',
    avatar: null,
    emailVerifiedAt: new Date('2025-01-01'),
    verificationCode: null,
    verificationCodeExpiresAt: null,
    passwordResetToken: null,
    passwordResetExpiresAt: null,
    status: 'ACTIVE' as UserStatus,
    role: 'ADVERTISER' as UserRole,
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: new Date('2025-06-01'),
    lastLoginIp: '192.168.1.1',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-06-01'),
    deletedAt: null,
    ...overrides,
  };
}

function createMockUserWithStats(overrides: Partial<User> = {}): UserWithStats {
  return {
    ...createMockUser(overrides),
    _count: { campaigns: 3 },
  };
}

function createMockUserWithRelations(
  overrides: Partial<User> = {},
): UserWithRelations {
  return {
    ...createMockUser(overrides),
    _count: { campaigns: 2 },
    campaigns: [
      {
        id: mockObjectId(100),
        name: 'Campaign A',
        status: 'ACTIVE',
        adFormat: 'BANNER',
        budget: 500,
        spent: 120,
        createdAt: new Date('2025-03-01'),
      },
      {
        id: mockObjectId(101),
        name: 'Campaign B',
        status: 'DRAFT',
        adFormat: 'INTERSTITIAL',
        budget: 1000,
        spent: 0,
        createdAt: new Date('2025-04-01'),
      },
    ],
    transactions: [
      {
        id: mockObjectId(200),
        type: 'DEPOSIT',
        amount: 500,
        status: 'COMPLETED',
        createdAt: new Date('2025-02-15'),
      },
    ],
  };
}

function createMockUserRepo(): IAdminUserManagementRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByEmail: vi.fn().mockResolvedValue(null),
    findMany: vi.fn().mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    }),
    count: vi.fn().mockResolvedValue(0),
    countByStatus: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue(createMockUser()),
    softDelete: vi.fn().mockResolvedValue(undefined),
    bulkUpdateStatus: vi.fn().mockResolvedValue(0),
    bulkSoftDelete: vi.fn().mockResolvedValue(0),
    getTotalSpent: vi.fn().mockResolvedValue(0),
    getNewUsersCount: vi.fn().mockResolvedValue(0),
  };
}

function createMockAuditLogRepo(): IAuditLogRepository {
  return {
    create: vi.fn().mockResolvedValue(undefined),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AdminUserManagementService', () => {
  let service: AdminUserManagementService;
  let userRepo: IAdminUserManagementRepository;
  let auditLogRepo: IAuditLogRepository;

  const adminId = mockObjectId(99);
  const ipAddress = '10.0.0.1';
  const userAgent = 'test-agent';

  beforeEach(() => {
    userRepo = createMockUserRepo();
    auditLogRepo = createMockAuditLogRepo();
    service = new AdminUserManagementService(userRepo, auditLogRepo);
  });

  // -----------------------------------------------------------------------
  // listAll
  // -----------------------------------------------------------------------
  describe('listAll', () => {
    it('should return paginated users with totalSpent', async () => {
      const mockUsers = [
        createMockUserWithStats({ id: mockObjectId(1) }),
        createMockUserWithStats({ id: mockObjectId(2), name: 'Jane Doe', email: 'jane@example.com' }),
      ];
      (userRepo.findMany as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockUsers,
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      });
      (userRepo.getTotalSpent as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(150.5)
        .mockResolvedValueOnce(300);

      const result = await service.listAll({}, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.data[0].totalSpent).toBe(150.5);
      expect(result.data[1].totalSpent).toBe(300);
      expect(result.data[0].campaignsCount).toBe(3);
      expect(userRepo.findMany).toHaveBeenCalledWith({}, { page: 1, limit: 20 });
      expect(userRepo.getTotalSpent).toHaveBeenCalledTimes(2);
    });
  });

  // -----------------------------------------------------------------------
  // getById
  // -----------------------------------------------------------------------
  describe('getById', () => {
    it('should return user detail with campaigns and transactions', async () => {
      const mockUser = createMockUserWithRelations();
      (userRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (userRepo.getTotalSpent as ReturnType<typeof vi.fn>).mockResolvedValue(120);

      const result = await service.getById(mockObjectId(1));

      expect(result.id).toBe(mockObjectId(1));
      expect(result.name).toBe('John Doe');
      expect(result.totalSpent).toBe(120);
      expect(result.emailVerified).toBe(true);
      expect(result.campaignsCount).toBe(2);
      expect(result.campaigns).toHaveLength(2);
      expect(result.campaigns[0].budget).toBe(500);
      expect(result.campaigns[0].spent).toBe(120);
      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].amount).toBe(500);
      expect(userRepo.findById).toHaveBeenCalledWith(mockObjectId(1));
      expect(userRepo.getTotalSpent).toHaveBeenCalledWith(mockObjectId(1));
    });

    it('should throw NotFoundError when user does not exist', async () => {
      await expect(service.getById(mockObjectId(999))).rejects.toThrow('User not found');
    });
  });

  // -----------------------------------------------------------------------
  // update
  // -----------------------------------------------------------------------
  describe('update', () => {
    it('should update user and create audit log', async () => {
      const existingUser = createMockUserWithRelations();
      (userRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(existingUser);
      (userRepo.getTotalSpent as ReturnType<typeof vi.fn>).mockResolvedValue(120);

      const updateData = { name: 'John Updated' };
      const result = await service.update(mockObjectId(1), updateData, adminId, ipAddress, userAgent);

      expect(result.id).toBe(mockObjectId(1));
      expect(userRepo.update).toHaveBeenCalledWith(mockObjectId(1), updateData);
      expect(auditLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userType: 'ADMIN',
          userId: adminId,
          action: 'USER_UPDATED',
          entityType: 'user',
          entityId: mockObjectId(1),
          oldValues: {
            name: existingUser.name,
            email: existingUser.email,
            status: existingUser.status,
          },
          newValues: updateData,
          ipAddress,
          userAgent,
        }),
      );
    });

    it('should throw NotFoundError when user does not exist', async () => {
      await expect(
        service.update(mockObjectId(999), { name: 'X' }, adminId, ipAddress),
      ).rejects.toThrow('User not found');
    });

    it('should throw ConflictError when email is already in use', async () => {
      const existingUser = createMockUserWithRelations({ email: 'old@example.com' });
      (userRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(existingUser);
      (userRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: mockObjectId(50),
        email: 'taken@example.com',
      });

      await expect(
        service.update(mockObjectId(1), { email: 'taken@example.com' }, adminId, ipAddress),
      ).rejects.toThrow('Email already in use');

      expect(userRepo.update).not.toHaveBeenCalled();
      expect(auditLogRepo.create).not.toHaveBeenCalled();
    });

    it('should skip email check when email is unchanged', async () => {
      const existingUser = createMockUserWithRelations({ email: 'john@example.com' });
      (userRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(existingUser);
      (userRepo.getTotalSpent as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      await service.update(mockObjectId(1), { email: 'john@example.com' }, adminId, ipAddress);

      expect(userRepo.findByEmail).not.toHaveBeenCalled();
      expect(userRepo.update).toHaveBeenCalledWith(mockObjectId(1), { email: 'john@example.com' });
    });
  });

  // -----------------------------------------------------------------------
  // updateStatus
  // -----------------------------------------------------------------------
  describe('updateStatus', () => {
    it('should update status and create audit log', async () => {
      const existingUser = createMockUserWithRelations({ status: 'ACTIVE' as UserStatus });
      (userRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(existingUser);
      (userRepo.getTotalSpent as ReturnType<typeof vi.fn>).mockResolvedValue(50);

      const result = await service.updateStatus(mockObjectId(1), 'INACTIVE', adminId, ipAddress, userAgent);

      expect(result.id).toBe(mockObjectId(1));
      expect(userRepo.update).toHaveBeenCalledWith(mockObjectId(1), { status: 'INACTIVE' });
      expect(auditLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_STATUS_CHANGED',
          oldValues: { status: 'ACTIVE' },
          newValues: { status: 'INACTIVE' },
        }),
      );
    });

    it('should use USER_SUSPENDED action when suspending', async () => {
      const existingUser = createMockUserWithRelations({ status: 'ACTIVE' as UserStatus });
      (userRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(existingUser);
      (userRepo.getTotalSpent as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      await service.updateStatus(mockObjectId(1), 'SUSPENDED', adminId, ipAddress);

      expect(auditLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_SUSPENDED',
          oldValues: { status: 'ACTIVE' },
          newValues: { status: 'SUSPENDED' },
        }),
      );
    });

    it('should throw NotFoundError when user does not exist', async () => {
      await expect(
        service.updateStatus(mockObjectId(999), 'ACTIVE', adminId, ipAddress),
      ).rejects.toThrow('User not found');
    });
  });

  // -----------------------------------------------------------------------
  // deleteUser
  // -----------------------------------------------------------------------
  describe('deleteUser', () => {
    it('should soft-delete user and create audit log', async () => {
      const existingUser = createMockUserWithRelations();
      (userRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(existingUser);

      await service.deleteUser(mockObjectId(1), adminId, ipAddress, userAgent);

      expect(userRepo.softDelete).toHaveBeenCalledWith(mockObjectId(1));
      expect(auditLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userType: 'ADMIN',
          userId: adminId,
          action: 'USER_DELETED',
          entityType: 'user',
          entityId: mockObjectId(1),
          oldValues: { name: existingUser.name, email: existingUser.email },
          ipAddress,
          userAgent,
        }),
      );
    });

    it('should throw NotFoundError when user does not exist', async () => {
      await expect(
        service.deleteUser(mockObjectId(999), adminId, ipAddress),
      ).rejects.toThrow('User not found');

      expect(userRepo.softDelete).not.toHaveBeenCalled();
      expect(auditLogRepo.create).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // bulkUpdateStatus
  // -----------------------------------------------------------------------
  describe('bulkUpdateStatus', () => {
    it('should report partial success when some IDs fail', async () => {
      const user1 = createMockUserWithRelations({ id: mockObjectId(1) });
      const user3 = createMockUserWithRelations({ id: mockObjectId(3) });

      (userRepo.findById as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(user1)   // id 1 -> found
        .mockResolvedValueOnce(null)    // id 2 -> not found
        .mockResolvedValueOnce(user3);  // id 3 -> found
      (userRepo.getTotalSpent as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      const result = await service.bulkUpdateStatus(
        [mockObjectId(1), mockObjectId(2), mockObjectId(3)],
        'SUSPENDED',
        adminId,
        ipAddress,
        userAgent,
      );

      expect(result.successful).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].id).toBe(mockObjectId(2));
      expect(result.errors[0].error).toContain('not found');
    });

    it('should return all successful when all IDs exist', async () => {
      const user1 = createMockUserWithRelations({ id: mockObjectId(1) });
      const user2 = createMockUserWithRelations({ id: mockObjectId(2) });

      (userRepo.findById as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(user1)
        .mockResolvedValueOnce(user2);
      (userRepo.getTotalSpent as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      const result = await service.bulkUpdateStatus(
        [mockObjectId(1), mockObjectId(2)],
        'ACTIVE',
        adminId,
        ipAddress,
      );

      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // bulkDelete
  // -----------------------------------------------------------------------
  describe('bulkDelete', () => {
    it('should delete all users and return success count', async () => {
      const user1 = createMockUserWithRelations({ id: mockObjectId(1) });
      const user2 = createMockUserWithRelations({ id: mockObjectId(2) });

      (userRepo.findById as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(user1)
        .mockResolvedValueOnce(user2);

      const result = await service.bulkDelete([mockObjectId(1), mockObjectId(2)], adminId, ipAddress, userAgent);

      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(userRepo.softDelete).toHaveBeenCalledTimes(2);
      expect(auditLogRepo.create).toHaveBeenCalledTimes(2);
    });

    it('should report failures for non-existent users', async () => {
      (userRepo.findById as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(createMockUserWithRelations({ id: mockObjectId(5) }));

      const result = await service.bulkDelete([mockObjectId(4), mockObjectId(5)], adminId, ipAddress);

      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors[0].id).toBe(mockObjectId(4));
    });
  });

  // -----------------------------------------------------------------------
  // getStatusCounts
  // -----------------------------------------------------------------------
  describe('getStatusCounts', () => {
    it('should return status counts from repository', async () => {
      const counts = [
        { status: 'ACTIVE' as UserStatus, count: 42 },
        { status: 'SUSPENDED' as UserStatus, count: 5 },
        { status: 'INACTIVE' as UserStatus, count: 10 },
      ];
      (userRepo.countByStatus as ReturnType<typeof vi.fn>).mockResolvedValue(counts);

      const result = await service.getStatusCounts();

      expect(result).toEqual([
        { status: 'active', count: 42 },
        { status: 'suspended', count: 5 },
        { status: 'inactive', count: 10 },
      ]);
      expect(userRepo.countByStatus).toHaveBeenCalledTimes(1);
    });
  });
});
