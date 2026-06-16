import type { Request, Response, NextFunction } from 'express';

import { success } from '../../../infrastructure/http/response.helper';
import type { AdFormatService } from '../services/ad-format.service';
import type { BoostTypeService } from '../services/boost-type.service';

export class PlatformController {
  constructor(
    private readonly adFormatService: AdFormatService,
    private readonly boostTypeService: BoostTypeService,
  ) {}

  listFormats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const formats = await this.adFormatService.listActive();
      success(res, formats);
    } catch (err) {
      next(err);
    }
  };

  showFormat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const format = await this.adFormatService.getById(id);
      success(res, format);
    } catch (err) {
      next(err);
    }
  };

  listBoostTypes = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const types = await this.boostTypeService.listActive();
      success(res, types);
    } catch (err) {
      next(err);
    }
  };

  showBoostType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const type = await this.boostTypeService.getById(id);
      success(res, type);
    } catch (err) {
      next(err);
    }
  };
}
