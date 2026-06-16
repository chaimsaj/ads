import { createLogger } from '../../../infrastructure/logging/logger';

const logger = createLogger('campaign-estimator');

export interface EstimateInput {
  budget: number;
  adFormat: string;
  durationDays: number;
  locationName?: string;
}

export interface CampaignEstimate {
  estimatedImpressions: { low: number; high: number };
  estimatedClicks: { low: number; high: number };
  estimatedCtr: { low: number; high: number };
  estimatedCpc: { low: number; high: number };
}

const FORMAT_BENCHMARKS: Record<string, { cpmLow: number; cpmHigh: number; ctrLow: number; ctrHigh: number }> = {
  BANNER: { cpmLow: 5, cpmHigh: 8, ctrLow: 0.5, ctrHigh: 1.5 },
  INTERSTITIAL: { cpmLow: 10, cpmHigh: 15, ctrLow: 2.0, ctrHigh: 5.0 },
  PUSH_NOTIFICATION: { cpmLow: 3, cpmHigh: 6, ctrLow: 3.0, ctrHigh: 8.0 },
};

export class CampaignEstimatorService {
  estimate(input: EstimateInput): CampaignEstimate {
    const benchmarks = FORMAT_BENCHMARKS[input.adFormat] ?? FORMAT_BENCHMARKS.BANNER;

    const impressionsHigh = Math.round((input.budget / benchmarks.cpmLow) * 1000);
    const impressionsLow = Math.round((input.budget / benchmarks.cpmHigh) * 1000);

    const clicksLow = Math.round(impressionsLow * (benchmarks.ctrLow / 100));
    const clicksHigh = Math.round(impressionsHigh * (benchmarks.ctrHigh / 100));

    const cpcLow = clicksHigh > 0 ? Math.round((input.budget / clicksHigh) * 100) / 100 : 0;
    const cpcHigh = clicksLow > 0 ? Math.round((input.budget / clicksLow) * 100) / 100 : 0;

    logger.info('Campaign estimate generated', {
      adFormat: input.adFormat,
      budget: input.budget,
      impressionsRange: `${impressionsLow}-${impressionsHigh}`,
    });

    return {
      estimatedImpressions: { low: impressionsLow, high: impressionsHigh },
      estimatedClicks: { low: clicksLow, high: clicksHigh },
      estimatedCtr: { low: benchmarks.ctrLow, high: benchmarks.ctrHigh },
      estimatedCpc: { low: cpcLow, high: cpcHigh },
    };
  }
}
