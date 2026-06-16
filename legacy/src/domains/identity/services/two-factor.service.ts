import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';

import type { ITwoFactorService, TwoFactorSecret } from '../interfaces/two-factor-service.interface';

const ISSUER = 'MynglyAds';

export class TwoFactorService implements ITwoFactorService {
  generateSecret(email: string): TwoFactorSecret {
    const secret = generateSecret();
    const otpauthUrl = generateURI({
      issuer: ISSUER,
      label: email,
      secret,
    });

    return { secret, otpauthUrl };
  }

  async generateQrCode(otpauthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpauthUrl);
  }

  verifyCode(secret: string, code: string): boolean {
    const result = verifySync({ secret, token: code });
    return result.valid;
  }
}
