import { describe, it, expect } from 'vitest';

import { dashboardQuerySchema } from '../dashboard.validator';

describe('Dashboard Validators', () => {
  describe('dashboardQuerySchema', () => {
    it('should use month as default period', () => {
      const result = dashboardQuerySchema.parse({});
      expect(result.period).toBe('month');
    });

    it('should accept valid period values', () => {
      for (const period of ['day', 'week', 'month', 'year']) {
        const result = dashboardQuerySchema.parse({ period });
        expect(result.period).toBe(period);
      }
    });

    it('should reject invalid period', () => {
      expect(() => dashboardQuerySchema.parse({ period: 'invalid' })).toThrow();
    });
  });
});
