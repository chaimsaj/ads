import crypto from 'node:crypto';

export class CryptoService {
  generateVerificationCode(): string {
    const buffer = crypto.randomBytes(4);
    const number = (buffer.readUInt32BE(0) % 900000) + 100000;
    return String(number);
  }

  generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  generateRefreshToken(): string {
    return crypto.randomBytes(48).toString('base64url');
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
