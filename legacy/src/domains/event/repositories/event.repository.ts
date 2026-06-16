import type { PrismaClient, Event } from '@prisma/client';
import type { IEventRepository } from '../interfaces/event-repository.interface';

export class EventRepository implements IEventRepository {
  constructor(private readonly db: PrismaClient) {}

  async searchByNameOrCode(query: string, limit: number): Promise<Event[]> {
    const codeNum = parseInt(query, 10);
    const isNumeric = !isNaN(codeNum) && String(codeNum) === query.trim();

    return this.db.event.findMany({
      where: isNumeric
        ? { code: codeNum }
        : { name: { contains: query } },
      take: limit,
      orderBy: { date: 'desc' },
    });
  }
}
