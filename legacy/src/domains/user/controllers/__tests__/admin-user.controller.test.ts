import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';
import { AdminUserController } from '../admin-user.controller';
import type { AdminUserManagementService } from '../../services/admin-user-management.service';

// Mock the response helper module
vi.mock('../../../../infrastructure/http/response.helper', () => ({
  success: vi.fn(),
  noContent: vi.fn(),
  paginated: vi.fn(),
}));

import { success, noContent, paginated } from '../../../../infrastructure/http/response.helper';

describe('AdminUserController', () => {
  let controller: AdminUserController;
  let mockUserService: Partial<AdminUserManagementService>;
  let mockReq: Request;
  let mockRes: Response;
  let mockNext: NextFunction;

  const mockUser = {
    id: mockObjectId(1),
    name: 'Test User',
    email: 'test@example.com',
    phone: '1234567890',
    company: 'Test Corp',
    status: 'ACTIVE',
  };

  const mockPaginatedResult = {
    data: [mockUser],
    meta: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUserService = {
      listAll: vi.fn(),
      getById: vi.fn(),
      update: vi.fn(),
      updateStatus: vi.fn(),
      deleteUser: vi.fn(),
      bulkUpdateStatus: vi.fn(),
      bulkDelete: vi.fn(),
      getStatusCounts: vi.fn(),
    };

    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { sub: mockObjectId(1), email: 'admin@example.com', role: 'admin', type: 'admin_access' },
      baseUrl: '/api/v1/admin',
      path: '/users',
      ip: '192.168.1.1',
      headers: { 'user-agent': 'Mozilla/5.0' },
    } as unknown as Request;

    mockRes = {} as Response;

    mockNext = vi.fn();

    controller = new AdminUserController(mockUserService as AdminUserManagementService);
  });

  describe('list', () => {
    it('should call userService.listAll with filters and pagination', async () => {
      mockReq.query = { page: 1, limit: 10, status: 'ACTIVE' };
      vi.mocked(mockUserService.listAll!).mockResolvedValue(mockPaginatedResult);

      await controller.list(mockReq, mockRes, mockNext);

      expect(mockUserService.listAll).toHaveBeenCalledWith(
        { status: 'ACTIVE' },
        { page: 1, limit: 10, sortBy: undefined, sortOrder: undefined },
      );
    });

    it('should call paginated helper on success', async () => {
      vi.mocked(mockUserService.listAll!).mockResolvedValue(mockPaginatedResult);

      await controller.list(mockReq, mockRes, mockNext);

      expect(paginated).toHaveBeenCalledWith(
        mockRes,
        mockPaginatedResult.data,
        {
          total: 1,
          currentPage: 1,
          lastPage: 1,
          perPage: 10,
        },
        '/api/v1/admin/users',
      );
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Database error');
      vi.mocked(mockUserService.listAll!).mockRejectedValue(error);

      await controller.list(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should extract sort parameters', async () => {
      mockReq.query = { page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' };
      vi.mocked(mockUserService.listAll!).mockResolvedValue(mockPaginatedResult);

      await controller.list(mockReq, mockRes, mockNext);

      expect(mockUserService.listAll).toHaveBeenCalledWith(
        {},
        { page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' },
      );
    });
  });

  describe('show', () => {
    it('should call userService.getById with user id', async () => {
      mockReq.params = { id: mockObjectId(5) };
      vi.mocked(mockUserService.getById!).mockResolvedValue(mockUser);

      await controller.show(mockReq, mockRes, mockNext);

      expect(mockUserService.getById).toHaveBeenCalledWith(mockObjectId(5));
    });

    it('should call success helper on success', async () => {
      mockReq.params = { id: mockObjectId(5) };
      vi.mocked(mockUserService.getById!).mockResolvedValue(mockUser);

      await controller.show(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, mockUser);
    });

    it('should call next with error on failure', async () => {
      mockReq.params = { id: mockObjectId(5) };
      const error = new Error('User not found');
      vi.mocked(mockUserService.getById!).mockRejectedValue(error);

      await controller.show(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('update', () => {
    const updateData = {
      name: 'Updated Name',
      phone: '9876543210',
    };

    it('should call userService.update with all parameters', async () => {
      mockReq.params = { id: mockObjectId(5) };
      mockReq.body = updateData;
      vi.mocked(mockUserService.update!).mockResolvedValue({ ...mockUser, ...updateData });

      await controller.update(mockReq, mockRes, mockNext);

      expect(mockUserService.update).toHaveBeenCalledWith(
        mockObjectId(5),
        updateData,
        mockObjectId(1),
        '192.168.1.1',
        'Mozilla/5.0',
      );
    });

    it('should call success helper with message on success', async () => {
      mockReq.params = { id: mockObjectId(5) };
      mockReq.body = updateData;
      const updatedUser = { ...mockUser, ...updateData };
      vi.mocked(mockUserService.update!).mockResolvedValue(updatedUser);

      await controller.update(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, updatedUser, 'User updated');
    });

    it('should use default IP when not available', async () => {
      mockReq.params = { id: mockObjectId(5) };
      mockReq.body = updateData;
      mockReq.ip = undefined;
      vi.mocked(mockUserService.update!).mockResolvedValue(mockUser);

      await controller.update(mockReq, mockRes, mockNext);

      expect(mockUserService.update).toHaveBeenCalledWith(
        mockObjectId(5),
        updateData,
        mockObjectId(1),
        '0.0.0.0',
        'Mozilla/5.0',
      );
    });

    it('should call next with error on failure', async () => {
      mockReq.params = { id: mockObjectId(5) };
      mockReq.body = updateData;
      const error = new Error('Update failed');
      vi.mocked(mockUserService.update!).mockRejectedValue(error);

      await controller.update(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateStatus', () => {
    it('should call userService.updateStatus with all parameters', async () => {
      mockReq.params = { id: mockObjectId(5) };
      mockReq.body = { status: 'SUSPENDED' };
      vi.mocked(mockUserService.updateStatus!).mockResolvedValue({ ...mockUser, status: 'SUSPENDED' });

      await controller.updateStatus(mockReq, mockRes, mockNext);

      expect(mockUserService.updateStatus).toHaveBeenCalledWith(
        mockObjectId(5),
        'SUSPENDED',
        mockObjectId(1),
        '192.168.1.1',
        'Mozilla/5.0',
      );
    });

    it('should call success helper with message on success', async () => {
      mockReq.params = { id: mockObjectId(5) };
      mockReq.body = { status: 'ACTIVE' };
      const updatedUser = { ...mockUser, status: 'ACTIVE' };
      vi.mocked(mockUserService.updateStatus!).mockResolvedValue(updatedUser);

      await controller.updateStatus(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, updatedUser, 'User status updated');
    });

    it('should call next with error on failure', async () => {
      mockReq.params = { id: mockObjectId(5) };
      mockReq.body = { status: 'ACTIVE' };
      const error = new Error('Status update failed');
      vi.mocked(mockUserService.updateStatus!).mockRejectedValue(error);

      await controller.updateStatus(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('suspend', () => {
    it('should call userService.updateStatus with SUSPENDED status', async () => {
      mockReq.params = { id: mockObjectId(5) };
      vi.mocked(mockUserService.updateStatus!).mockResolvedValue({ ...mockUser, status: 'SUSPENDED' });

      await controller.suspend(mockReq, mockRes, mockNext);

      expect(mockUserService.updateStatus).toHaveBeenCalledWith(
        mockObjectId(5),
        'SUSPENDED',
        mockObjectId(1),
        '192.168.1.1',
        'Mozilla/5.0',
      );
    });

    it('should call success helper with "User suspended" message', async () => {
      mockReq.params = { id: mockObjectId(5) };
      const suspendedUser = { ...mockUser, status: 'SUSPENDED' };
      vi.mocked(mockUserService.updateStatus!).mockResolvedValue(suspendedUser);

      await controller.suspend(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, suspendedUser, 'User suspended');
    });

    it('should call next with error on failure', async () => {
      mockReq.params = { id: mockObjectId(5) };
      const error = new Error('Suspend failed');
      vi.mocked(mockUserService.updateStatus!).mockRejectedValue(error);

      await controller.suspend(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('activate', () => {
    it('should call userService.updateStatus with ACTIVE status', async () => {
      mockReq.params = { id: mockObjectId(5) };
      vi.mocked(mockUserService.updateStatus!).mockResolvedValue({ ...mockUser, status: 'ACTIVE' });

      await controller.activate(mockReq, mockRes, mockNext);

      expect(mockUserService.updateStatus).toHaveBeenCalledWith(
        mockObjectId(5),
        'ACTIVE',
        mockObjectId(1),
        '192.168.1.1',
        'Mozilla/5.0',
      );
    });

    it('should call success helper with "User activated" message', async () => {
      mockReq.params = { id: mockObjectId(5) };
      const activatedUser = { ...mockUser, status: 'ACTIVE' };
      vi.mocked(mockUserService.updateStatus!).mockResolvedValue(activatedUser);

      await controller.activate(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, activatedUser, 'User activated');
    });

    it('should call next with error on failure', async () => {
      mockReq.params = { id: mockObjectId(5) };
      const error = new Error('Activate failed');
      vi.mocked(mockUserService.updateStatus!).mockRejectedValue(error);

      await controller.activate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('destroy', () => {
    it('should call userService.deleteUser with all parameters', async () => {
      mockReq.params = { id: mockObjectId(5) };
      vi.mocked(mockUserService.deleteUser!).mockResolvedValue();

      await controller.destroy(mockReq, mockRes, mockNext);

      expect(mockUserService.deleteUser).toHaveBeenCalledWith(
        mockObjectId(5),
        mockObjectId(1),
        '192.168.1.1',
        'Mozilla/5.0',
      );
    });

    it('should call noContent helper on success', async () => {
      mockReq.params = { id: mockObjectId(5) };
      vi.mocked(mockUserService.deleteUser!).mockResolvedValue();

      await controller.destroy(mockReq, mockRes, mockNext);

      expect(noContent).toHaveBeenCalledWith(mockRes);
    });

    it('should call next with error on failure', async () => {
      mockReq.params = { id: mockObjectId(5) };
      const error = new Error('Delete failed');
      vi.mocked(mockUserService.deleteUser!).mockRejectedValue(error);

      await controller.destroy(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('bulkAction', () => {
    it('should handle activate action', async () => {
      mockReq.body = { ids: [mockObjectId(1), mockObjectId(2), mockObjectId(3)], action: 'activate' };
      const result = { updated: 3 };
      vi.mocked(mockUserService.bulkUpdateStatus!).mockResolvedValue(result);

      await controller.bulkAction(mockReq, mockRes, mockNext);

      expect(mockUserService.bulkUpdateStatus).toHaveBeenCalledWith(
        [mockObjectId(1), mockObjectId(2), mockObjectId(3)],
        'ACTIVE',
        mockObjectId(1),
        '192.168.1.1',
        'Mozilla/5.0',
      );
      expect(success).toHaveBeenCalledWith(mockRes, result, 'Bulk activate completed');
    });

    it('should handle suspend action', async () => {
      mockReq.body = { ids: [mockObjectId(1), mockObjectId(2)], action: 'suspend' };
      const result = { updated: 2 };
      vi.mocked(mockUserService.bulkUpdateStatus!).mockResolvedValue(result);

      await controller.bulkAction(mockReq, mockRes, mockNext);

      expect(mockUserService.bulkUpdateStatus).toHaveBeenCalledWith(
        [mockObjectId(1), mockObjectId(2)],
        'SUSPENDED',
        mockObjectId(1),
        '192.168.1.1',
        'Mozilla/5.0',
      );
      expect(success).toHaveBeenCalledWith(mockRes, result, 'Bulk suspend completed');
    });

    it('should handle delete action', async () => {
      mockReq.body = { ids: [mockObjectId(1)], action: 'delete' };
      const result = { deleted: 1 };
      vi.mocked(mockUserService.bulkDelete!).mockResolvedValue(result);

      await controller.bulkAction(mockReq, mockRes, mockNext);

      expect(mockUserService.bulkDelete).toHaveBeenCalledWith(
        [mockObjectId(1)],
        mockObjectId(1),
        '192.168.1.1',
        'Mozilla/5.0',
      );
      expect(success).toHaveBeenCalledWith(mockRes, result, 'Bulk delete completed');
    });

    it('should call next with error on failure', async () => {
      mockReq.body = { ids: [mockObjectId(1)], action: 'activate' };
      const error = new Error('Bulk action failed');
      vi.mocked(mockUserService.bulkUpdateStatus!).mockRejectedValue(error);

      await controller.bulkAction(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('statusCounts', () => {
    const mockCounts = {
      ACTIVE: 100,
      SUSPENDED: 10,
      PENDING: 5,
    };

    it('should call userService.getStatusCounts', async () => {
      vi.mocked(mockUserService.getStatusCounts!).mockResolvedValue(mockCounts);

      await controller.statusCounts(mockReq, mockRes, mockNext);

      expect(mockUserService.getStatusCounts).toHaveBeenCalled();
    });

    it('should call success helper on success', async () => {
      vi.mocked(mockUserService.getStatusCounts!).mockResolvedValue(mockCounts);

      await controller.statusCounts(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, mockCounts);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Failed to get counts');
      vi.mocked(mockUserService.getStatusCounts!).mockRejectedValue(error);

      await controller.statusCounts(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('admin context', () => {
    it('should use correct admin id for all operations', async () => {
      mockReq.user = { sub: mockObjectId(42), email: 'superadmin@example.com', role: 'super_admin', type: 'admin_access' };
      mockReq.params = { id: mockObjectId(10) };
      mockReq.body = { name: 'Test' };
      vi.mocked(mockUserService.update!).mockResolvedValue(mockUser);

      await controller.update(mockReq, mockRes, mockNext);

      expect(mockUserService.update).toHaveBeenCalledWith(
        mockObjectId(10),
        { name: 'Test' },
        mockObjectId(42),
        expect.any(String),
        expect.any(String),
      );
    });
  });
});
