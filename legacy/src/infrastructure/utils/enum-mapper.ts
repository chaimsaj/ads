/**
 * Maps Prisma enum TypeScript names to their @map() database values.
 *
 * Prisma returns uppercase enum names (e.g. ACTIVE, BANNER, BRAND)
 * but the frontends expect the @map() values (e.g. active, Banner, brand).
 *
 * This module provides a single function to convert any Prisma enum
 * to its frontend-expected value.
 */

const ENUM_MAP: Record<string, string> = {
  // UserStatus
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',

  // UserRole
  USER: 'user',
  ADVERTISER: 'advertiser',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',

  // AdType
  // USER: 'user',       (already mapped above)
  EVENT: 'event',
  BRAND: 'brand',

  // BoostType
  STANDARD: 'standard',
  PREMIUM: 'premium',

  // AdFormat
  BANNER: 'Banner',
  INTERSTITIAL: 'Interstitial',
  PUSH: 'Push',

  // CampaignStatus
  DRAFT: 'draft',
  REVIEW: 'review',
  // ACTIVE: 'active',   (already mapped above)
  PAUSED: 'paused',
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  REJECTED: 'rejected',

  // Gender
  ALL: 'all',
  MALE: 'male',
  FEMALE: 'female',

  // TransactionType
  CHARGE: 'charge',
  REFUND: 'refund',
  CREDIT: 'credit',
  ADJUSTMENT: 'adjustment',

  // TransactionStatus
  PENDING: 'pending',
  // COMPLETED: 'completed', (already mapped above)
  FAILED: 'failed',
  REFUNDED: 'refunded',

  // AdminRole
  // ADMIN: 'admin',         (already mapped above)
  // SUPER_ADMIN: 'super_admin', (already mapped above)
  MODERATOR: 'moderator',
  SUPPORT: 'support',

  // AdminStatus (same as UserStatus subset)
  // ACTIVE: 'active',
  // INACTIVE: 'inactive',

  // AuditUserType
  // USER: 'user',
  // ADMIN: 'admin',
  SYSTEM: 'system',

  // SettingType
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  JSON: 'json',

  // TokenUserType
  // USER: 'user',
  // ADMIN: 'admin',
};

export function mapEnum(value: string): string {
  return ENUM_MAP[value] ?? value;
}
