export type AdType = 'user' | 'event' | 'brand';

export interface CampaignWizardData {
  name?: string;
  adType?: AdType;
  spotlightUserId?: string;
  spotlightUsername?: string;
  spotlightUserCompany?: string;
  spotlightUserAvatar?: string;
  eventId?: string;
  eventCode?: number;
  eventName?: string;
  eventAddress?: string;
  eventDate?: string;
  eventBannerImage?: string;
  brandName?: string;
  brandTagline?: string;
  boostType?: string;
  campaignImage?: string;
  audienceCity?: string;
  audienceIndustry?: string;
  audienceGoals?: string[];
  audienceEducation?: string[];
  audienceExperience?: string[];
  adFormat?: string;
  adText?: string;
  link?: string;
  bannerImage?: string;
  hasBanner?: boolean;
  address?: string;
  radius?: string;
  startDate?: string;
  endDate?: string;
  latitude?: number | null;
  longitude?: number | null;
  budget?: string;
  paymentMethodId?: string;
  paymentMethodLabel?: string;
}

const WIZARD_STORAGE_KEY = 'campaignWizard';

export function getWizardData(): CampaignWizardData {
  try {
    return JSON.parse(localStorage.getItem(WIZARD_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveWizardData(data: Partial<CampaignWizardData>): void {
  const existing = getWizardData();
  localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify({ ...existing, ...data }));
}

export function clearWizardData(): void {
  localStorage.removeItem(WIZARD_STORAGE_KEY);
}

const TYPE_SPECIFIC_KEYS: Record<AdType, Array<keyof CampaignWizardData>> = {
  user: ['spotlightUserId', 'spotlightUsername', 'spotlightUserCompany', 'spotlightUserAvatar', 'boostType', 'campaignImage'],
  event: ['eventId', 'eventCode', 'eventName', 'eventAddress', 'eventDate', 'eventBannerImage'],
  brand: ['brandName', 'brandTagline', 'adFormat'],
};

/**
 * Clears every field specific to ad types other than `keepType`, so switching type mid-wizard
 * never leaks a stale target/format from an abandoned selection into the final submission.
 */
export function clearOtherTypeFields(keepType: AdType): void {
  const existing = getWizardData();
  const cleared: CampaignWizardData = { ...existing };
  (Object.keys(TYPE_SPECIFIC_KEYS) as AdType[])
    .filter((type) => type !== keepType)
    .forEach((type) => {
      TYPE_SPECIFIC_KEYS[type].forEach((key) => {
        delete cleared[key];
      });
    });
  localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(cleared));
}

export function isIdentityStepComplete(data: CampaignWizardData): boolean {
  return !!data.name && !!data.adType;
}

export function isTargetOrBrandStepComplete(data: CampaignWizardData): boolean {
  if (!isIdentityStepComplete(data)) return false;
  if (data.adType === 'brand') return !!data.brandName;
  if (data.adType === 'user') return !!data.spotlightUserId;
  if (data.adType === 'event') return !!data.eventId;
  return false;
}

export function isTypeCreativeStepComplete(data: CampaignWizardData): boolean {
  if (!isTargetOrBrandStepComplete(data)) return false;
  if (data.adType === 'brand') return !!data.adFormat;
  if (data.adType === 'user') return !!data.boostType;
  return true;
}

export function isAdContentStepComplete(data: CampaignWizardData): boolean {
  if (!isTypeCreativeStepComplete(data)) return false;
  if (data.adType === 'brand') return !!data.adText && !!data.link;
  return true;
}

export function isTargetingStepComplete(data: CampaignWizardData): boolean {
  if (!isAdContentStepComplete(data)) return false;
  if (!data.address || !data.startDate || !data.endDate) return false;
  return new Date(data.endDate) > new Date(data.startDate);
}

export function isPaymentStepComplete(data: CampaignWizardData): boolean {
  if (!isTargetingStepComplete(data)) return false;
  return parseFloat(data.budget || '0') >= 10 && !!data.paymentMethodId;
}
