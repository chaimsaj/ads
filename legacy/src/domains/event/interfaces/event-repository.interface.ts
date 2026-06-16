import type { Event } from '@prisma/client';

export interface IEventRepository {
  searchByNameOrCode(query: string, limit: number): Promise<Event[]>;
}
