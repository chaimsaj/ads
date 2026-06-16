import type { Request, Response, NextFunction } from 'express';
import { success } from '../../../infrastructure/http/response.helper';
import type { EventService } from '../services/event.service';

export class EventController {
  constructor(private readonly eventService: EventService) {}

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = String(req.query.q || '').trim();
      if (query.length < 2) {
        success(res, []);
        return;
      }
      const results = await this.eventService.searchEvents(query, 10);
      success(res, results);
    } catch (err) {
      next(err);
    }
  };
}
