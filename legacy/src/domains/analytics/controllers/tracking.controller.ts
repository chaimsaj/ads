import type { Request, Response, NextFunction } from 'express';

import { success } from '../../../infrastructure/http/response.helper';
import type { TrackingService } from '../services/tracking.service';

const TRANSPARENT_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  trackImpression = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { campaignId, userId, deviceId, adFormat } = req.body;
      await this.trackingService.trackEvent({
        campaignId,
        type: 'impression',
        userId,
        deviceId,
        metadata: adFormat ? { adFormat } : undefined,
      });
      success(res, { tracked: true });
    } catch (err) {
      next(err);
    }
  };

  trackClick = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { campaignId, userId, deviceId, adFormat, destinationUrl } = req.body;
      await this.trackingService.trackEvent({
        campaignId,
        type: 'click',
        userId,
        deviceId,
        metadata: { adFormat, destinationUrl },
      });
      success(res, { tracked: true });
    } catch (err) {
      next(err);
    }
  };

  trackConversion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { campaignId, type, userId, amount } = req.body;
      await this.trackingService.trackEvent({
        campaignId,
        type,
        userId,
        metadata: amount !== undefined ? { amount } : undefined,
      });
      success(res, { tracked: true });
    } catch (err) {
      next(err);
    }
  };

  pixelTrack = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawParam = String(req.params.campaignId ?? '');
      const campaignId = rawParam.replace(/\.png$/, '');
      const type = (req.query.type as string) ?? 'impression';

      const validTypes = ['impression', 'click', 'application', 'deposit'] as const;
      const eventType = validTypes.includes(type as typeof validTypes[number])
        ? (type as typeof validTypes[number])
        : 'impression';

      await this.trackingService.trackEvent({
        campaignId,
        type: eventType,
        deviceId: req.headers['user-agent'] as string | undefined,
      });

      res.set({
        'Content-Type': 'image/png',
        'Content-Length': String(TRANSPARENT_PIXEL.length),
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        Pragma: 'no-cache',
        Expires: '0',
      });
      res.status(200).end(TRANSPARENT_PIXEL);
    } catch (err) {
      next(err);
    }
  };
}
