import type { TokenUserType } from '@prisma/client';

// ---- JWT Payloads ----

export interface AccessTokenPayload {
  readonly sub: string;
  readonly email: string;
  readonly role: string;
  readonly type: 'access' | 'admin_access';
  readonly permissions?: readonly string[];
}

export interface RefreshTokenPayload {
  readonly sub: string;
  readonly type: 'refresh' | 'admin_refresh';
  readonly jti: string;
}

// ---- Token Pair ----

export interface TokenPair {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
}

// ---- Advertiser Auth DTOs ----

export interface RegisterRequest {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly phone?: string;
  readonly company?: string;
}

export interface LoginRequest {
  readonly email: string;
  readonly password: string;
}

export interface VerifyEmailRequest {
  readonly email: string;
  readonly code: string;
}

export interface ForgotPasswordRequest {
  readonly email: string;
}

export interface ResetPasswordRequest {
  readonly token: string;
  readonly password: string;
}

export interface ChangePasswordRequest {
  readonly currentPassword: string;
  readonly newPassword: string;
}

// ---- Admin Auth DTOs ----

export interface AdminLoginRequest {
  readonly email: string;
  readonly password: string;
  readonly twoFactorCode?: string;
}

export interface TwoFactorSetupResponse {
  readonly secret: string;
  readonly qrCodeUrl: string;
}

export interface TwoFactorVerifyRequest {
  readonly code: string;
}

// ---- Auth Responses ----

export interface AuthResponse {
  readonly user: AuthenticatedUserInfo;
  readonly expiresIn: number;
}

export interface AdminAuthResponse {
  readonly user: AuthenticatedAdminInfo;
  readonly expiresIn: number;
  readonly requiresTwoFactor?: boolean;
}

export interface AuthenticatedUserInfo {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
  readonly emailVerified: boolean;
}

export interface AuthenticatedAdminInfo {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
  readonly twoFactorEnabled: boolean;
  readonly permissions: readonly string[] | null;
}

// ---- Refresh Token Metadata ----

export interface RefreshTokenMeta {
  readonly userType: TokenUserType;
  readonly userId: string;
  readonly deviceName?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

// ---- Authenticated User (from middleware) ----

export interface AuthenticatedUser {
  readonly sub: string;
  readonly email: string;
  readonly role: string;
  readonly type: 'access' | 'admin_access';
  readonly permissions?: readonly string[];
}
