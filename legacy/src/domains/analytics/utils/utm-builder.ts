interface UtmParams {
  campaignId: string;
  adFormat?: string;
  locationName?: string;
}

export function appendUtmParams(url: string, params: UtmParams): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('utm_source', 'myngly');
    parsed.searchParams.set('utm_medium', 'in_app_ad');
    parsed.searchParams.set('utm_campaign', params.campaignId);
    if (params.adFormat) {
      parsed.searchParams.set('utm_content', params.adFormat);
    }
    if (params.locationName) {
      parsed.searchParams.set('utm_term', params.locationName);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}
