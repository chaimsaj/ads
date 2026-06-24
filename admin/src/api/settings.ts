import { apiClient } from './client';
import type { AdminSettings } from '../types';

interface BackendSetting {
  id: string;
  settingKey: string;
  settingValue: string | null;
  settingType: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

const DEFAULTS: AdminSettings = {
  siteName: 'Myngly Ads',
  supportEmail: 'support@myngly.com',
  defaultCurrency: 'USD',
  minBudget: 50,
  maxBudget: 50000,
  commissionRate: 10,
  autoApprove: false,
  maintenanceMode: false,
  emailNotifications: true,
  pushNotifications: true,
  weeklyReports: false,
};

function parseValue(raw: BackendSetting): string | number | boolean {
  const val = raw.settingValue ?? '';
  switch (raw.settingType) {
    case 'number':
      return Number(val) || 0;
    case 'boolean':
      return val === 'true' || val === '1';
    default:
      return val;
  }
}

function mapSettings(settings: BackendSetting[]): AdminSettings {
  const result = { ...DEFAULTS };
  for (const setting of settings) {
    const key = setting.settingKey as keyof AdminSettings;
    if (key in result) {
      (result as Record<string, unknown>)[key] = parseValue(setting);
    }
  }
  return result;
}

function toSettingsArray(
  data: Partial<AdminSettings>,
): Array<{ key: string; value: string | null }> {
  return Object.entries(data).map(([key, value]) => ({
    key,
    value: value != null ? String(value) : null,
  }));
}

export const settingsApi = {
  get: async (): Promise<AdminSettings> => {
    const raw = await apiClient.post<BackendSetting[]>('/settings/get');
    return mapSettings(raw);
  },

  update: async (data: Partial<AdminSettings>): Promise<AdminSettings> => {
    const raw = await apiClient.post<BackendSetting[]>('/settings/update', {
      settings: toSettingsArray(data),
    });
    return mapSettings(raw);
  },
};
