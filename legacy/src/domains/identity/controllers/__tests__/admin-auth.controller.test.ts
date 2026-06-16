import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

import { AdminAuthController } from '../admin-auth.controller';
import type { IAdminAuthService } from '../../interfaces/admin-auth-service.interface';
import type { AdminAuthResponse, TwoFactorSetupResponse } from '../../types/auth.types';
import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';

// Mock the response helper module
vi.mock('../../../../infrastructure/http/response.helper', () => ({
  success: vi.fn(),
  noContent: vi.fn(),
}));

import { success, noContent } from '../../../../infrastructure/http/response.helper';

describe('AdminAuthController', () => {
  let controller: AdminAuthController;
  let mockAdminAuthService: IAdminAuthService;
  let mockReq: Request;
  let mockRes: Response;
  let mockNext: NextFunction;

  const mockAdminAuthResponse: AdminAuthResponse = {
    user: {
      id: mockObjectId(1),
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
      twoFactorEnabled: false,
      permissions: ['users:read', 'users:write'],
    },
    expiresIn: 900,
    requiresTwoFactor: false,
  };

  const mockTwoFactorSetupResponse: TwoFactorSetupResponse = {
    secret: 'JBSWY3DPEHPK3PXP',
    qrCodeUrl: 'data:image/png;base64,iVBORw0KGgo...',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockAdminAuthService = {
      login: vi.fn(),
      refreshToken: vi.fn(),
      logout: vi.fn(),
      changePassword: vi.fn(),
      getProfile: vi.fn(),
      setupTwoFactor: vi.fn(),
      enableTwoFactor: vi.fn(),
      disableTwoFactor: vi.fn(),
    };

    mockReq = {
      body: {},
      user: { sub: mockObjectId(1), email: 'admin@example.com', role: 'admin', type: 'admin_access' },
    } as unknown as Request;

    mockRes = {} as Response;

    mockNext = vi.fn();

    controller = new AdminAuthController(mockAdminAuthService);
  });

  describe('login', () => {
    const loginData = {
      email: 'admin@example.com',
      password: 'adminpassword123',
    };

    it('should call adminAuthService.login with request body, req, and res', async () => {
      mockReq.body = loginData;
      vi.mocked(mockAdminAuthService.login).mockResolvedValue(mockAdminAuthResponse);

      await controller.login(mockReq, mockRes, mockNext);

      expect(mockAdminAuthService.login).toHaveBeenCalledWith(loginData, mockReq, mockRes);
    });

    it('should call success helper with "Login successful" message when no 2FA required', async () => {
      mockReq.body = loginData;
      vi.mocked(mockAdminAuthService.login).mockResolvedValue(mockAdminAuthResponse);

      await controller.login(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, mockAdminAuthResponse, 'Login successful');
    });

    it('should call success helper with "Two-factor code required" when 2FA required', async () => {
      mockReq.body = loginData;
      const responseWith2FA: AdminAuthResponse = {
        ...mockAdminAuthResponse,
        requiresTwoFactor: true,
      };
      vi.mocked(mockAdminAuthService.login).mockResolvedValue(responseWith2FA);

      await controller.login(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, responseWith2FA, 'Two-factor code required');
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Invalid credentials');
      mockReq.body = loginData;
      vi.mocked(mockAdminAuthService.login).mockRejectedValue(error);

      await controller.login(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should not call success helper on failure', async () => {
      const error = new Error('Invalid credentials');
      mockReq.body = loginData;
      vi.mocked(mockAdminAuthService.login).mockRejectedValue(error);

      await controller.login(mockReq, mockRes, mockNext);

      expect(success).not.toHaveBeenCalled();
    });

    it('should handle login with two-factor code', async () => {
      const loginDataWith2FA = {
        email: 'admin@example.com',
        password: 'adminpassword123',
        twoFactorCode: '123456',
      };
      mockReq.body = loginDataWith2FA;
      vi.mocked(mockAdminAuthService.login).mockResolvedValue(mockAdminAuthResponse);

      await controller.login(mockReq, mockRes, mockNext);

      expect(mockAdminAuthService.login).toHaveBeenCalledWith(loginDataWith2FA, mockReq, mockRes);
    });
  });

  describe('refresh', () => {
    it('should call adminAuthService.refreshToken with req and res', async () => {
      vi.mocked(mockAdminAuthService.refreshToken).mockResolvedValue(mockAdminAuthResponse);

      await controller.refresh(mockReq, mockRes, mockNext);

      expect(mockAdminAuthService.refreshToken).toHaveBeenCalledWith(mockReq, mockRes);
    });

    it('should call success helper on success', async () => {
      vi.mocked(mockAdminAuthService.refreshToken).mockResolvedValue(mockAdminAuthResponse);

      await controller.refresh(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, mockAdminAuthResponse);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Invalid refresh token');
      vi.mocked(mockAdminAuthService.refreshToken).mockRejectedValue(error);

      await controller.refresh(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('logout', () => {
    it('should call adminAuthService.logout with req and res', async () => {
      vi.mocked(mockAdminAuthService.logout).mockResolvedValue();

      await controller.logout(mockReq, mockRes, mockNext);

      expect(mockAdminAuthService.logout).toHaveBeenCalledWith(mockReq, mockRes);
    });

    it('should call noContent helper on success', async () => {
      vi.mocked(mockAdminAuthService.logout).mockResolvedValue();

      await controller.logout(mockReq, mockRes, mockNext);

      expect(noContent).toHaveBeenCalledWith(mockRes);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Logout failed');
      vi.mocked(mockAdminAuthService.logout).mockRejectedValue(error);

      await controller.logout(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getProfile', () => {
    it('should call adminAuthService.getProfile with admin id', async () => {
      vi.mocked(mockAdminAuthService.getProfile).mockResolvedValue(mockAdminAuthResponse.user);

      await controller.getProfile(mockReq, mockRes, mockNext);

      expect(mockAdminAuthService.getProfile).toHaveBeenCalledWith(mockObjectId(1));
    });

    it('should call success helper on success', async () => {
      vi.mocked(mockAdminAuthService.getProfile).mockResolvedValue(mockAdminAuthResponse.user);

      await controller.getProfile(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, mockAdminAuthResponse.user);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Admin not found');
      vi.mocked(mockAdminAuthService.getProfile).mockRejectedValue(error);

      await controller.getProfile(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should use user.sub from request for admin id', async () => {
      mockReq.user = { sub: mockObjectId(42), email: 'other@example.com', role: 'admin', type: 'admin_access' };
      vi.mocked(mockAdminAuthService.getProfile).mockResolvedValue(mockAdminAuthResponse.user);

      await controller.getProfile(mockReq, mockRes, mockNext);

      expect(mockAdminAuthService.getProfile).toHaveBeenCalledWith(mockObjectId(42));
    });
  });

  describe('changePassword', () => {
    const changeData = {
      currentPassword: 'oldpassword123',
      newPassword: 'newpassword123',
    };

    it('should call adminAuthService.changePassword with admin id and request body', async () => {
      mockReq.body = changeData;
      vi.mocked(mockAdminAuthService.changePassword).mockResolvedValue();

      await controller.changePassword(mockReq, mockRes, mockNext);

      expect(mockAdminAuthService.changePassword).toHaveBeenCalledWith(mockObjectId(1), changeData);
    });

    it('should call noContent helper on success', async () => {
      mockReq.body = changeData;
      vi.mocked(mockAdminAuthService.changePassword).mockResolvedValue();

      await controller.changePassword(mockReq, mockRes, mockNext);

      expect(noContent).toHaveBeenCalledWith(mockRes);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Current password is incorrect');
      mockReq.body = changeData;
      vi.mocked(mockAdminAuthService.changePassword).mockRejectedValue(error);

      await controller.changePassword(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should use user.sub from request for admin id', async () => {
      mockReq.user = { sub: mockObjectId(99), email: 'another@example.com', role: 'admin', type: 'admin_access' };
      mockReq.body = changeData;
      vi.mocked(mockAdminAuthService.changePassword).mockResolvedValue();

      await controller.changePassword(mockReq, mockRes, mockNext);

      expect(mockAdminAuthService.changePassword).toHaveBeenCalledWith(mockObjectId(99), changeData);
    });
  });

  describe('setupTwoFactor', () => {
    it('should call adminAuthService.setupTwoFactor with admin id', async () => {
      vi.mocked(mockAdminAuthService.setupTwoFactor).mockResolvedValue(mockTwoFactorSetupResponse);

      await controller.setupTwoFactor(mockReq, mockRes, mockNext);

      expect(mockAdminAuthService.setupTwoFactor).toHaveBeenCalledWith(mockObjectId(1));
    });

    it('should call success helper on success', async () => {
      vi.mocked(mockAdminAuthService.setupTwoFactor).mockResolvedValue(mockTwoFactorSetupResponse);

      await controller.setupTwoFactor(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, mockTwoFactorSetupResponse);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Failed to setup 2FA');
      vi.mocked(mockAdminAuthService.setupTwoFactor).mockRejectedValue(error);

      await controller.setupTwoFactor(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should use user.sub from request for admin id', async () => {
      mockReq.user = { sub: mockObjectId(50), email: 'admin2@example.com', role: 'admin', type: 'admin_access' };
      vi.mocked(mockAdminAuthService.setupTwoFactor).mockResolvedValue(mockTwoFactorSetupResponse);

      await controller.setupTwoFactor(mockReq, mockRes, mockNext);

      expect(mockAdminAuthService.setupTwoFactor).toHaveBeenCalledWith(mockObjectId(50));
    });
  });

  describe('enableTwoFactor', () => {
    const enableData = {
      code: '123456',
    };

    it('should call adminAuthService.enableTwoFactor with admin id and code', async () => {
      mockReq.body = enableData;
      vi.mocked(mockAdminAuthService.enableTwoFactor).mockResolvedValue();

      await controller.enableTwoFactor(mockReq, mockRes, mockNext);

      expect(mockAdminAuthService.enableTwoFactor).toHaveBeenCalledWith(mockObjectId(1), '123456');
    });

    it('should call success helper with message on success', async () => {
      mockReq.body = enableData;
      vi.mocked(mockAdminAuthService.enableTwoFactor).mockResolvedValue();

      await controller.enableTwoFactor(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(
        mockRes,
        null,
        'Two-factor authentication enabled'
      );
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Invalid verification code');
      mockReq.body = enableData;
      vi.mocked(mockAdminAuthService.enableTwoFactor).mockRejectedValue(error);

      await controller.enableTwoFactor(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should use user.sub from request for admin id', async () => {
      mockReq.user = { sub: mockObjectId(75), email: 'admin3@example.com', role: 'admin', type: 'admin_access' };
      mockReq.body = enableData;
      vi.mocked(mockAdminAuthService.enableTwoFactor).mockResolvedValue();

      await controller.enableTwoFactor(mockReq, mockRes, mockNext);

      expect(mockAdminAuthService.enableTwoFactor).toHaveBeenCalledWith(mockObjectId(75), '123456');
    });
  });

  describe('disableTwoFactor', () => {
    const disableData = {
      code: '654321',
    };

    it('should call adminAuthService.disableTwoFactor with admin id and code', async () => {
      mockReq.body = disableData;
      vi.mocked(mockAdminAuthService.disableTwoFactor).mockResolvedValue();

      await controller.disableTwoFactor(mockReq, mockRes, mockNext);

      expect(mockAdminAuthService.disableTwoFactor).toHaveBeenCalledWith(mockObjectId(1), '654321');
    });

    it('should call success helper with message on success', async () => {
      mockReq.body = disableData;
      vi.mocked(mockAdminAuthService.disableTwoFactor).mockResolvedValue();

      await controller.disableTwoFactor(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(
        mockRes,
        null,
        'Two-factor authentication disabled'
      );
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Invalid verification code');
      mockReq.body = disableData;
      vi.mocked(mockAdminAuthService.disableTwoFactor).mockRejectedValue(error);

      await controller.disableTwoFactor(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should use user.sub from request for admin id', async () => {
      mockReq.user = { sub: mockObjectId(88), email: 'admin4@example.com', role: 'admin', type: 'admin_access' };
      mockReq.body = disableData;
      vi.mocked(mockAdminAuthService.disableTwoFactor).mockResolvedValue();

      await controller.disableTwoFactor(mockReq, mockRes, mockNext);

      expect(mockAdminAuthService.disableTwoFactor).toHaveBeenCalledWith(mockObjectId(88), '654321');
    });
  });

  describe('error handling consistency', () => {
    it('should consistently pass errors to next middleware', async () => {
      const testCases = [
        { method: 'login', setupMock: () => vi.mocked(mockAdminAuthService.login).mockRejectedValue(new Error('test')) },
        { method: 'refresh', setupMock: () => vi.mocked(mockAdminAuthService.refreshToken).mockRejectedValue(new Error('test')) },
        { method: 'logout', setupMock: () => vi.mocked(mockAdminAuthService.logout).mockRejectedValue(new Error('test')) },
        { method: 'getProfile', setupMock: () => vi.mocked(mockAdminAuthService.getProfile).mockRejectedValue(new Error('test')) },
        { method: 'changePassword', setupMock: () => vi.mocked(mockAdminAuthService.changePassword).mockRejectedValue(new Error('test')) },
        { method: 'setupTwoFactor', setupMock: () => vi.mocked(mockAdminAuthService.setupTwoFactor).mockRejectedValue(new Error('test')) },
        { method: 'enableTwoFactor', setupMock: () => vi.mocked(mockAdminAuthService.enableTwoFactor).mockRejectedValue(new Error('test')) },
        { method: 'disableTwoFactor', setupMock: () => vi.mocked(mockAdminAuthService.disableTwoFactor).mockRejectedValue(new Error('test')) },
      ];

      for (const testCase of testCases) {
        vi.clearAllMocks();
        testCase.setupMock();
        mockReq.body = { code: '123456' }; // Ensure body has required fields

        const methodFn = controller[testCase.method as keyof AdminAuthController] as (
          req: Request,
          res: Response,
          next: NextFunction
        ) => Promise<void>;

        await methodFn(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      }
    });
  });
});
