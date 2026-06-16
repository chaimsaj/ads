import { describe, it, expect } from 'vitest';
import { generateSync } from 'otplib';

import { TwoFactorService } from '../two-factor.service';

describe('TwoFactorService', () => {
  const service = new TwoFactorService();

  describe('generateSecret', () => {
    it('should return a secret and otpauth URL', () => {
      const result = service.generateSecret('user@example.com');
      expect(result.secret).toBeTruthy();
      expect(result.secret.length).toBeGreaterThan(10);
      expect(result.otpauthUrl).toContain('otpauth://totp/');
      expect(result.otpauthUrl).toContain('MynglyAds');
      expect(result.otpauthUrl).toContain('user%40example.com');
    });

    it('should generate unique secrets each time', () => {
      const result1 = service.generateSecret('a@b.com');
      const result2 = service.generateSecret('a@b.com');
      expect(result1.secret).not.toBe(result2.secret);
    });
  });

  describe('generateQrCode', () => {
    it('should return a data URL for a QR code', async () => {
      const { otpauthUrl } = service.generateSecret('test@test.com');
      const qrCode = await service.generateQrCode(otpauthUrl);
      expect(qrCode).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe('verifyCode', () => {
    it('should return true for a valid TOTP code', () => {
      const { secret } = service.generateSecret('test@test.com');
      const validCode = generateSync({ secret });
      const result = service.verifyCode(secret, validCode);
      expect(result).toBe(true);
    });

    it('should return false for an invalid code', () => {
      const { secret } = service.generateSecret('test@test.com');
      const result = service.verifyCode(secret, '000000');
      expect(result).toBe(false);
    });
  });
});
