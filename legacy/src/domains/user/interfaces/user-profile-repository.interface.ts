import type { User } from '@prisma/client';

export interface IUserProfileRepository {
  findById(id: string): Promise<User | null>;
  searchByName(query: string, limit: number): Promise<User[]>;
  updateProfile(id: string, data: ProfileUpdateData): Promise<User>;
  updateAvatar(id: string, avatarPath: string): Promise<User>;
  updatePassword(id: string, hashedPassword: string): Promise<User>;
  softDelete(id: string): Promise<void>;
}

export interface ProfileUpdateData {
  readonly name?: string;
  readonly phone?: string | null;
  readonly company?: string | null;
}
