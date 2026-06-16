import type { User, PrismaClient } from '@prisma/client';

import type { IUserProfileRepository, ProfileUpdateData } from '../interfaces/user-profile-repository.interface';

export class UserProfileRepository implements IUserProfileRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return this.db.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async searchByName(query: string, limit: number): Promise<User[]> {
    return this.db.user.findMany({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        name: { contains: query },
      },
      take: limit,
      orderBy: { name: 'asc' },
    });
  }

  async updateProfile(id: string, data: ProfileUpdateData): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.company !== undefined && { company: data.company }),
      },
    });
  }

  async updateAvatar(id: string, avatarPath: string): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: { avatar: avatarPath },
    });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.db.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'INACTIVE',
      },
    });
  }
}
