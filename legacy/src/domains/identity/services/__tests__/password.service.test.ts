import { describe, it, expect } from 'vitest';

import { PasswordService } from '../password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  describe('hash', () => {
    it('should return a bcrypt hash string', async () => {
      const hash = await service.hash('TestPassword123!');
      expect(hash).toMatch(/^\$2[aby]\$/);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should produce different hashes for the same input', async () => {
      const hash1 = await service.hash('SamePassword1!');
      const hash2 = await service.hash('SamePassword1!');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('compare', () => {
    it('should return true for matching password', async () => {
      const password = 'MySecurePass1!';
      const hash = await service.hash(password);
      const result = await service.compare(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const hash = await service.hash('CorrectPassword1!');
      const result = await service.compare('WrongPassword1!', hash);
      expect(result).toBe(false);
    });
  });
});
