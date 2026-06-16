import bcrypt from 'bcryptjs';

import { BCRYPT_ROUNDS } from '../../../shared/constants/auth.constants';
import type { IPasswordService } from '../interfaces/password-service.interface';

export class PasswordService implements IPasswordService {
  async hash(plaintext: string): Promise<string> {
    return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
  }

  async compare(plaintext: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plaintext, hashed);
  }
}
