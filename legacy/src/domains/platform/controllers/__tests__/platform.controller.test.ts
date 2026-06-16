import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';
import { PlatformController } from '../platform.controller';
import type { AdFormatService } from '../../services/ad-format.service';
import type { BoostTypeService } from '../../services/boost-type.service';

// Mock the response helper module
vi.mock('../../../../infrastructure/http/response.helper', () => ({
  success: vi.fn(),
}));

import { success } from '../../../../infrastructure/http/response.helper';

describe('PlatformController', () => {
  let controller: PlatformController;
  let mockAdFormatService: Partial<AdFormatService>;
  let mockBoostTypeService: Partial<BoostTypeService>;
  let mockReq: Request;
  let mockRes: Response;
  let mockNext: NextFunction;

  const mockAdFormats = [
    { id: mockObjectId(1), name: 'Banner', slug: 'banner', description: 'Standard banner ad', isActive: true },
    { id: mockObjectId(2), name: 'Video', slug: 'video', description: 'Video advertisement', isActive: true },
  ];

  const mockBoostTypes = [
    { id: mockObjectId(1), name: 'Standard', slug: 'standard', multiplier: 1.0, isActive: true },
    { id: mockObjectId(2), name: 'Premium', slug: 'premium', multiplier: 2.0, isActive: true },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockAdFormatService = {
      listActive: vi.fn(),
      getById: vi.fn(),
    };

    mockBoostTypeService = {
      listActive: vi.fn(),
      getById: vi.fn(),
    };

    mockReq = {
      params: {},
    } as unknown as Request;

    mockRes = {} as Response;

    mockNext = vi.fn();

    controller = new PlatformController(
      mockAdFormatService as AdFormatService,
      mockBoostTypeService as BoostTypeService,
    );
  });

  describe('listFormats', () => {
    it('should call adFormatService.listActive', async () => {
      vi.mocked(mockAdFormatService.listActive!).mockResolvedValue(mockAdFormats);

      await controller.listFormats(mockReq, mockRes, mockNext);

      expect(mockAdFormatService.listActive).toHaveBeenCalled();
    });

    it('should call success helper on success', async () => {
      vi.mocked(mockAdFormatService.listActive!).mockResolvedValue(mockAdFormats);

      await controller.listFormats(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, mockAdFormats);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Failed to fetch formats');
      vi.mocked(mockAdFormatService.listActive!).mockRejectedValue(error);

      await controller.listFormats(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should return empty array when no formats', async () => {
      vi.mocked(mockAdFormatService.listActive!).mockResolvedValue([]);

      await controller.listFormats(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, []);
    });
  });

  describe('showFormat', () => {
    it('should call adFormatService.getById with id from params', async () => {
      mockReq.params = { id: mockObjectId(5) };
      vi.mocked(mockAdFormatService.getById!).mockResolvedValue(mockAdFormats[0]);

      await controller.showFormat(mockReq, mockRes, mockNext);

      expect(mockAdFormatService.getById).toHaveBeenCalledWith(mockObjectId(5));
    });

    it('should call success helper on success', async () => {
      mockReq.params = { id: mockObjectId(1) };
      vi.mocked(mockAdFormatService.getById!).mockResolvedValue(mockAdFormats[0]);

      await controller.showFormat(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, mockAdFormats[0]);
    });

    it('should call next with error on failure', async () => {
      mockReq.params = { id: mockObjectId(999) };
      const error = new Error('Format not found');
      vi.mocked(mockAdFormatService.getById!).mockRejectedValue(error);

      await controller.showFormat(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should pass id as string', async () => {
      mockReq.params = { id: mockObjectId(123) };
      vi.mocked(mockAdFormatService.getById!).mockResolvedValue(mockAdFormats[0]);

      await controller.showFormat(mockReq, mockRes, mockNext);

      expect(mockAdFormatService.getById).toHaveBeenCalledWith(mockObjectId(123));
    });
  });

  describe('listBoostTypes', () => {
    it('should call boostTypeService.listActive', async () => {
      vi.mocked(mockBoostTypeService.listActive!).mockResolvedValue(mockBoostTypes);

      await controller.listBoostTypes(mockReq, mockRes, mockNext);

      expect(mockBoostTypeService.listActive).toHaveBeenCalled();
    });

    it('should call success helper on success', async () => {
      vi.mocked(mockBoostTypeService.listActive!).mockResolvedValue(mockBoostTypes);

      await controller.listBoostTypes(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, mockBoostTypes);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Failed to fetch boost types');
      vi.mocked(mockBoostTypeService.listActive!).mockRejectedValue(error);

      await controller.listBoostTypes(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should return empty array when no boost types', async () => {
      vi.mocked(mockBoostTypeService.listActive!).mockResolvedValue([]);

      await controller.listBoostTypes(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, []);
    });
  });

  describe('showBoostType', () => {
    it('should call boostTypeService.getById with id from params', async () => {
      mockReq.params = { id: mockObjectId(5) };
      vi.mocked(mockBoostTypeService.getById!).mockResolvedValue(mockBoostTypes[0]);

      await controller.showBoostType(mockReq, mockRes, mockNext);

      expect(mockBoostTypeService.getById).toHaveBeenCalledWith(mockObjectId(5));
    });

    it('should call success helper on success', async () => {
      mockReq.params = { id: mockObjectId(1) };
      vi.mocked(mockBoostTypeService.getById!).mockResolvedValue(mockBoostTypes[0]);

      await controller.showBoostType(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, mockBoostTypes[0]);
    });

    it('should call next with error on failure', async () => {
      mockReq.params = { id: mockObjectId(999) };
      const error = new Error('Boost type not found');
      vi.mocked(mockBoostTypeService.getById!).mockRejectedValue(error);

      await controller.showBoostType(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should pass id as string', async () => {
      mockReq.params = { id: mockObjectId(456) };
      vi.mocked(mockBoostTypeService.getById!).mockResolvedValue(mockBoostTypes[1]);

      await controller.showBoostType(mockReq, mockRes, mockNext);

      expect(mockBoostTypeService.getById).toHaveBeenCalledWith(mockObjectId(456));
    });
  });
});
