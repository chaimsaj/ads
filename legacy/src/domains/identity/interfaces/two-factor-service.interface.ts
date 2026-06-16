export interface ITwoFactorService {
  generateSecret(email: string): TwoFactorSecret;
  generateQrCode(otpauthUrl: string): Promise<string>;
  verifyCode(secret: string, code: string): boolean;
}

export interface TwoFactorSecret {
  readonly secret: string;
  readonly otpauthUrl: string;
}
