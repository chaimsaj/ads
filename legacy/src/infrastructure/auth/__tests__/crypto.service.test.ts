import { describe, it, expect } from 'vitest';

import { CryptoService } from '../crypto.service';

describe('CryptoService', () => {
  const cryptoService = new CryptoService();

  describe('generateVerificationCode', () => {
    it('should generate a 6-digit string', () => {
      const code = cryptoService.generateVerificationCode();
      expect(code).toMatch(/^\d{6}$/);
    });

    it('should generate codes between 100000 and 999999', () => {
      for (let i = 0; i < 100; i++) {
        const code = parseInt(cryptoService.generateVerificationCode(), 10);
        expect(code).toBeGreaterThanOrEqual(100000);
        expect(code).toBeLessThanOrEqual(999999);
      }
    });
  });

  describe('generateResetToken', () => {
    it('should generate a 64-character hex string', () => {
      const token = cryptoService.generateResetToken();
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate unique tokens', () => {
      const token1 = cryptoService.generateResetToken();
      const token2 = cryptoService.generateResetToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a non-empty base64url string', () => {
      const token = cryptoService.generateRefreshToken();
      expect(token.length).toBeGreaterThan(0);
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should generate unique tokens', () => {
      const token1 = cryptoService.generateRefreshToken();
      const token2 = cryptoService.generateRefreshToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('hashToken', () => {
    it('should produce a 64-character hex SHA-256 hash', () => {
      const hash = cryptoService.hashToken('test-token');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should produce deterministic output', () => {
      const hash1 = cryptoService.hashToken('same-token');
      const hash2 = cryptoService.hashToken('same-token');
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = cryptoService.hashToken('token-a');
      const hash2 = cryptoService.hashToken('token-b');
      expect(hash1).not.toBe(hash2);
    });
  });
});
