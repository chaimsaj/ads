import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AuditLog, AuditUserType } from '@prisma/client';

import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';
import type { IAdminAuditLogRepository } from '../../interfaces/admin-audit-log-repository.interface';
import { AuditLogService } from '../audit-log.service';

function createMockAuditLog(overrides: Partial<AuditLog> = {}): AuditLog {
  return {
    id: mockObjectId(1),
    userType: 'ADMIN' as AuditUserType,
    userId: mockObjectId(1),
    action: 'settings.update',
    entityType: 'SystemSetting',
    entityId: mockObjectId(1),
    oldValues: null,
    newValues: null,
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    createdAt: new Date('2025-01-01'),
    ...overrides,
  };
}

function createMockRepo(): IAdminAuditLogRepository {
  return {
    create: vi.fn().mockResolvedValue(undefined),
    findMany: vi.fn().mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }),
    findById: vi.fn().mockResolvedValue(null),
    count: vi.fn().mockResolvedValue(0),
  };
}

describe('AuditLogService', () => {
  let service: AuditLogService;
  let repo: IAdminAuditLogRepository;

  beforeEach(() => {
    repo = createMockRepo();
    service = new AuditLogService(repo);
  });

  describe('list', () => {
    it('should return paginated audit logs with string ids', async () => {
      const mockLogs = [createMockAuditLog(), createMockAuditLog({ id: mockObjectId(2) })];
      (repo.findMany as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockLogs,
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      });

      const result = await service.list({}, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe(mockObjectId(1));
      expect(result.data[1].id).toBe(mockObjectId(2));
      expect(result.meta.total).toBe(2);
    });
  });

  describe('getById', () => {
    it('should return audit log by id with string id', async () => {
      (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(createMockAuditLog());

      const result = await service.getById(mockObjectId(1));

      expect(result.id).toBe(mockObjectId(1));
      expect(result.action).toBe('settings.update');
      expect(repo.findById).toHaveBeenCalledWith(mockObjectId(1));
    });

    it('should throw NotFoundError if audit log not found', async () => {
      await expect(service.getById(mockObjectId(999))).rejects.toThrow('Audit log');
    });
  });
});
