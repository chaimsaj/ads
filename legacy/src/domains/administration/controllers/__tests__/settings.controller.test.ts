import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';
import { SettingsController } from '../settings.controller';
import type { SettingsService } from '../../services/settings.service';

// Mock the response helper module
vi.mock('../../../../infrastructure/http/response.helper', () => ({
  success: vi.fn(),
}));

import { success } from '../../../../infrastructure/http/response.helper';

describe('SettingsController', () => {
  let controller: SettingsController;
  let mockSettingsService: Partial<SettingsService>;
  let mockReq: Request;
  let mockRes: Response;
  let mockNext: NextFunction;

  const mockSettings = [
    { key: 'site.name', value: 'Myngly Ads', group: 'general' },
    { key: 'site.email', value: 'support@myngly.com', group: 'general' },
  ];

  const mockGroupedSettings = {
    general: [
      { key: 'site.name', value: 'Myngly Ads' },
      { key: 'site.email', value: 'support@myngly.com' },
    ],
    payment: [
      { key: 'payment.currency', value: 'USD' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockSettingsService = {
      getAll: vi.fn(),
      getGrouped: vi.fn(),
      getSingle: vi.fn(),
      update: vi.fn(),
    };

    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { sub: mockObjectId(1), email: 'admin@example.com', role: 'admin', type: 'admin_access' },
      ip: '192.168.1.1',
      get: vi.fn().mockReturnValue('Mozilla/5.0'),
    } as unknown as Request;

    mockRes = {} as Response;

    mockNext = vi.fn();

    controller = new SettingsController(mockSettingsService as SettingsService);
  });

  describe('list', () => {
    it('should call settingsService.getAll', async () => {
      vi.mocked(mockSettingsService.getAll!).mockResolvedValue(mockSettings);

      await controller.list(mockReq, mockRes, mockNext);

      expect(mockSettingsService.getAll).toHaveBeenCalled();
    });

    it('should call success helper on success', async () => {
      vi.mocked(mockSettingsService.getAll!).mockResolvedValue(mockSettings);

      await controller.list(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, mockSettings);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Failed to fetch settings');
      vi.mocked(mockSettingsService.getAll!).mockRejectedValue(error);

      await controller.list(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('listGrouped', () => {
    it('should call settingsService.getGrouped', async () => {
      vi.mocked(mockSettingsService.getGrouped!).mockResolvedValue(mockGroupedSettings);

      await controller.listGrouped(mockReq, mockRes, mockNext);

      expect(mockSettingsService.getGrouped).toHaveBeenCalled();
    });

    it('should call success helper on success', async () => {
      vi.mocked(mockSettingsService.getGrouped!).mockResolvedValue(mockGroupedSettings);

      await controller.listGrouped(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, mockGroupedSettings);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Failed to fetch grouped settings');
      vi.mocked(mockSettingsService.getGrouped!).mockRejectedValue(error);

      await controller.listGrouped(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('show', () => {
    it('should call settingsService.getSingle with key from params', async () => {
      mockReq.params = { key: 'site.name' };
      const setting = { key: 'site.name', value: 'Myngly Ads' };
      vi.mocked(mockSettingsService.getSingle!).mockResolvedValue(setting);

      await controller.show(mockReq, mockRes, mockNext);

      expect(mockSettingsService.getSingle).toHaveBeenCalledWith('site.name');
    });

    it('should call success helper on success', async () => {
      mockReq.params = { key: 'site.name' };
      const setting = { key: 'site.name', value: 'Myngly Ads' };
      vi.mocked(mockSettingsService.getSingle!).mockResolvedValue(setting);

      await controller.show(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, setting);
    });

    it('should call next with error on failure', async () => {
      mockReq.params = { key: 'nonexistent' };
      const error = new Error('Setting not found');
      vi.mocked(mockSettingsService.getSingle!).mockRejectedValue(error);

      await controller.show(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('update', () => {
    const updateData = {
      settings: [
        { key: 'site.name', value: 'New Name' },
        { key: 'site.email', value: 'new@example.com' },
      ],
    };

    it('should call settingsService.update with correct parameters', async () => {
      mockReq.body = updateData;
      vi.mocked(mockSettingsService.update!).mockResolvedValue({ updated: 2 });

      await controller.update(mockReq, mockRes, mockNext);

      expect(mockSettingsService.update).toHaveBeenCalledWith(
        updateData.settings,
        mockObjectId(1),
        '192.168.1.1',
        'Mozilla/5.0',
      );
    });

    it('should call success helper with message on success', async () => {
      mockReq.body = updateData;
      const result = { updated: 2 };
      vi.mocked(mockSettingsService.update!).mockResolvedValue(result);

      await controller.update(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, result, 'Settings updated successfully');
    });

    it('should call next with error on failure', async () => {
      mockReq.body = updateData;
      const error = new Error('Failed to update settings');
      vi.mocked(mockSettingsService.update!).mockRejectedValue(error);

      await controller.update(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should use admin id from request user', async () => {
      mockReq.body = updateData;
      mockReq.user = { sub: mockObjectId(42), email: 'superadmin@example.com', role: 'super_admin', type: 'admin_access' };
      vi.mocked(mockSettingsService.update!).mockResolvedValue({ updated: 2 });

      await controller.update(mockReq, mockRes, mockNext);

      expect(mockSettingsService.update).toHaveBeenCalledWith(
        updateData.settings,
        mockObjectId(42),
        expect.any(String),
        expect.any(String),
      );
    });
  });
});
