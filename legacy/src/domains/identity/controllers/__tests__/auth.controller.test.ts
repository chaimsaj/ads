import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

import { AuthController } from '../auth.controller';
import type { IAuthService } from '../../interfaces/auth-service.interface';
import type { AuthResponse } from '../../types/auth.types';
import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';

// Mock the response helper module
vi.mock('../../../../infrastructure/http/response.helper', () => ({
  success: vi.fn(),
  created: vi.fn(),
  noContent: vi.fn(),
}));

import { success, created, noContent } from '../../../../infrastructure/http/response.helper';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: IAuthService;
  let mockReq: Request;
  let mockRes: Response;
  let mockNext: NextFunction;

  const mockAuthResponse: AuthResponse = {
    user: {
      id: mockObjectId(1),
      name: 'Test User',
      email: 'test@example.com',
      role: 'advertiser',
      emailVerified: true,
    },
    expiresIn: 900,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuthService = {
      register: vi.fn(),
      login: vi.fn(),
      verifyEmail: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
      changePassword: vi.fn(),
      refreshToken: vi.fn(),
      logout: vi.fn(),
      logoutAll: vi.fn(),
    };

    mockReq = {
      body: {},
      user: { sub: mockObjectId(1), email: 'test@example.com', role: 'advertiser', type: 'access' },
    } as unknown as Request;

    mockRes = {} as Response;

    mockNext = vi.fn();

    controller = new AuthController(mockAuthService);
  });

  describe('register', () => {
    const registerData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should call authService.register with request body', async () => {
      mockReq.body = registerData;
      vi.mocked(mockAuthService.register).mockResolvedValue(mockAuthResponse);

      await controller.register(mockReq, mockRes, mockNext);

      expect(mockAuthService.register).toHaveBeenCalledWith(registerData);
    });

    it('should call created helper on success', async () => {
      mockReq.body = registerData;
      vi.mocked(mockAuthService.register).mockResolvedValue(mockAuthResponse);

      await controller.register(mockReq, mockRes, mockNext);

      expect(created).toHaveBeenCalledWith(
        mockRes,
        mockAuthResponse,
        'Registration successful. Please verify your email.'
      );
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Registration failed');
      mockReq.body = registerData;
      vi.mocked(mockAuthService.register).mockRejectedValue(error);

      await controller.register(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should not call created helper on failure', async () => {
      const error = new Error('Registration failed');
      mockReq.body = registerData;
      vi.mocked(mockAuthService.register).mockRejectedValue(error);

      await controller.register(mockReq, mockRes, mockNext);

      expect(created).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should call authService.login with request body, req, and res', async () => {
      mockReq.body = loginData;
      vi.mocked(mockAuthService.login).mockResolvedValue(mockAuthResponse);

      await controller.login(mockReq, mockRes, mockNext);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginData, mockReq, mockRes);
    });

    it('should call success helper on successful login', async () => {
      mockReq.body = loginData;
      vi.mocked(mockAuthService.login).mockResolvedValue(mockAuthResponse);

      await controller.login(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, mockAuthResponse, 'Login successful');
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Invalid credentials');
      mockReq.body = loginData;
      vi.mocked(mockAuthService.login).mockRejectedValue(error);

      await controller.login(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should not call success helper on failure', async () => {
      const error = new Error('Invalid credentials');
      mockReq.body = loginData;
      vi.mocked(mockAuthService.login).mockRejectedValue(error);

      await controller.login(mockReq, mockRes, mockNext);

      expect(success).not.toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    const verifyData = {
      email: 'test@example.com',
      code: '123456',
    };

    it('should call authService.verifyEmail with request body', async () => {
      mockReq.body = verifyData;
      vi.mocked(mockAuthService.verifyEmail).mockResolvedValue();

      await controller.verifyEmail(mockReq, mockRes, mockNext);

      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(verifyData);
    });

    it('should call success helper with null data on success', async () => {
      mockReq.body = verifyData;
      vi.mocked(mockAuthService.verifyEmail).mockResolvedValue();

      await controller.verifyEmail(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, null, 'Email verified successfully');
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Invalid verification code');
      mockReq.body = verifyData;
      vi.mocked(mockAuthService.verifyEmail).mockRejectedValue(error);

      await controller.verifyEmail(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('forgotPassword', () => {
    const forgotData = {
      email: 'test@example.com',
    };

    it('should call authService.forgotPassword with request body', async () => {
      mockReq.body = forgotData;
      vi.mocked(mockAuthService.forgotPassword).mockResolvedValue();

      await controller.forgotPassword(mockReq, mockRes, mockNext);

      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(forgotData);
    });

    it('should call success helper with generic message on success', async () => {
      mockReq.body = forgotData;
      vi.mocked(mockAuthService.forgotPassword).mockResolvedValue();

      await controller.forgotPassword(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(
        mockRes,
        null,
        'If the email exists, a reset link has been sent.'
      );
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Service error');
      mockReq.body = forgotData;
      vi.mocked(mockAuthService.forgotPassword).mockRejectedValue(error);

      await controller.forgotPassword(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('resetPassword', () => {
    const resetData = {
      token: 'reset-token-123',
      password: 'newpassword123',
    };

    it('should call authService.resetPassword with request body', async () => {
      mockReq.body = resetData;
      vi.mocked(mockAuthService.resetPassword).mockResolvedValue();

      await controller.resetPassword(mockReq, mockRes, mockNext);

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(resetData);
    });

    it('should call success helper on success', async () => {
      mockReq.body = resetData;
      vi.mocked(mockAuthService.resetPassword).mockResolvedValue();

      await controller.resetPassword(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, null, 'Password reset successful');
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Invalid or expired token');
      mockReq.body = resetData;
      vi.mocked(mockAuthService.resetPassword).mockRejectedValue(error);

      await controller.resetPassword(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('changePassword', () => {
    const changeData = {
      currentPassword: 'oldpassword123',
      newPassword: 'newpassword123',
    };

    it('should call authService.changePassword with userId and request body', async () => {
      mockReq.body = changeData;
      vi.mocked(mockAuthService.changePassword).mockResolvedValue();

      await controller.changePassword(mockReq, mockRes, mockNext);

      expect(mockAuthService.changePassword).toHaveBeenCalledWith(mockObjectId(1), changeData);
    });

    it('should call noContent helper on success', async () => {
      mockReq.body = changeData;
      vi.mocked(mockAuthService.changePassword).mockResolvedValue();

      await controller.changePassword(mockReq, mockRes, mockNext);

      expect(noContent).toHaveBeenCalledWith(mockRes);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Current password is incorrect');
      mockReq.body = changeData;
      vi.mocked(mockAuthService.changePassword).mockRejectedValue(error);

      await controller.changePassword(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should use user.sub from request for userId', async () => {
      mockReq.user = { sub: mockObjectId(42), email: 'other@example.com', role: 'advertiser', type: 'access' };
      mockReq.body = changeData;
      vi.mocked(mockAuthService.changePassword).mockResolvedValue();

      await controller.changePassword(mockReq, mockRes, mockNext);

      expect(mockAuthService.changePassword).toHaveBeenCalledWith(mockObjectId(42), changeData);
    });
  });

  describe('refresh', () => {
    it('should call authService.refreshToken with req and res', async () => {
      vi.mocked(mockAuthService.refreshToken).mockResolvedValue(mockAuthResponse);

      await controller.refresh(mockReq, mockRes, mockNext);

      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(mockReq, mockRes);
    });

    it('should call success helper on success', async () => {
      vi.mocked(mockAuthService.refreshToken).mockResolvedValue(mockAuthResponse);

      await controller.refresh(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, mockAuthResponse);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Invalid refresh token');
      vi.mocked(mockAuthService.refreshToken).mockRejectedValue(error);

      await controller.refresh(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('logout', () => {
    it('should call authService.logout with req and res', async () => {
      vi.mocked(mockAuthService.logout).mockResolvedValue();

      await controller.logout(mockReq, mockRes, mockNext);

      expect(mockAuthService.logout).toHaveBeenCalledWith(mockReq, mockRes);
    });

    it('should call noContent helper on success', async () => {
      vi.mocked(mockAuthService.logout).mockResolvedValue();

      await controller.logout(mockReq, mockRes, mockNext);

      expect(noContent).toHaveBeenCalledWith(mockRes);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Logout failed');
      vi.mocked(mockAuthService.logout).mockRejectedValue(error);

      await controller.logout(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('logoutAll', () => {
    it('should call authService.logoutAll with userId and res', async () => {
      vi.mocked(mockAuthService.logoutAll).mockResolvedValue();

      await controller.logoutAll(mockReq, mockRes, mockNext);

      expect(mockAuthService.logoutAll).toHaveBeenCalledWith(mockObjectId(1), mockRes);
    });

    it('should call noContent helper on success', async () => {
      vi.mocked(mockAuthService.logoutAll).mockResolvedValue();

      await controller.logoutAll(mockReq, mockRes, mockNext);

      expect(noContent).toHaveBeenCalledWith(mockRes);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Logout all failed');
      vi.mocked(mockAuthService.logoutAll).mockRejectedValue(error);

      await controller.logoutAll(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should use user.sub from request for userId', async () => {
      mockReq.user = { sub: mockObjectId(99), email: 'another@example.com', role: 'advertiser', type: 'access' };
      vi.mocked(mockAuthService.logoutAll).mockResolvedValue();

      await controller.logoutAll(mockReq, mockRes, mockNext);

      expect(mockAuthService.logoutAll).toHaveBeenCalledWith(mockObjectId(99), mockRes);
    });
  });

  describe('error handling consistency', () => {
    it('should consistently pass errors to next middleware', async () => {
      const testCases = [
        { method: 'register', setupMock: () => vi.mocked(mockAuthService.register).mockRejectedValue(new Error('test')) },
        { method: 'login', setupMock: () => vi.mocked(mockAuthService.login).mockRejectedValue(new Error('test')) },
        { method: 'verifyEmail', setupMock: () => vi.mocked(mockAuthService.verifyEmail).mockRejectedValue(new Error('test')) },
        { method: 'forgotPassword', setupMock: () => vi.mocked(mockAuthService.forgotPassword).mockRejectedValue(new Error('test')) },
        { method: 'resetPassword', setupMock: () => vi.mocked(mockAuthService.resetPassword).mockRejectedValue(new Error('test')) },
        { method: 'changePassword', setupMock: () => vi.mocked(mockAuthService.changePassword).mockRejectedValue(new Error('test')) },
        { method: 'refresh', setupMock: () => vi.mocked(mockAuthService.refreshToken).mockRejectedValue(new Error('test')) },
        { method: 'logout', setupMock: () => vi.mocked(mockAuthService.logout).mockRejectedValue(new Error('test')) },
        { method: 'logoutAll', setupMock: () => vi.mocked(mockAuthService.logoutAll).mockRejectedValue(new Error('test')) },
      ];

      for (const testCase of testCases) {
        vi.clearAllMocks();
        testCase.setupMock();

        const methodFn = controller[testCase.method as keyof AuthController] as (
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
