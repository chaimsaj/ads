import type { IEventRepository } from '../interfaces/event-repository.interface';
import type { EventSearchResultDTO } from '../types/event.types';

export class EventService {
  constructor(private readonly eventRepo: IEventRepository) {}

  async searchEvents(query: string, limit = 10): Promise<EventSearchResultDTO[]> {
    const events = await this.eventRepo.searchByNameOrCode(query, limit);
    return events.map((e) => ({
      id: e.id,
      code: e.code,
      name: e.name,
      address: e.address,
      date: e.date.toISOString(),
      bannerImage: e.bannerImage,
    }));
  }
}
