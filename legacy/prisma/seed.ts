import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // =====================================================
  // SYSTEM SETTINGS
  // =====================================================
  const systemSettings = [
    { settingKey: 'site_name', settingValue: 'Myngly Ads', settingType: 'STRING' as const, description: 'Platform name', isPublic: true },
    { settingKey: 'support_email', settingValue: 'support@myngly.com', settingType: 'STRING' as const, description: 'Support contact email', isPublic: true },
    { settingKey: 'default_currency', settingValue: 'USD', settingType: 'STRING' as const, description: 'Default currency code', isPublic: true },
    { settingKey: 'min_campaign_budget', settingValue: '50', settingType: 'NUMBER' as const, description: 'Minimum campaign budget', isPublic: true },
    { settingKey: 'max_campaign_budget', settingValue: '50000', settingType: 'NUMBER' as const, description: 'Maximum campaign budget', isPublic: true },
    { settingKey: 'commission_rate', settingValue: '15', settingType: 'NUMBER' as const, description: 'Platform commission percentage', isPublic: false },
    { settingKey: 'auto_approve_campaigns', settingValue: 'false', settingType: 'BOOLEAN' as const, description: 'Auto-approve campaigns that pass checks', isPublic: false },
    { settingKey: 'maintenance_mode', settingValue: 'false', settingType: 'BOOLEAN' as const, description: 'Enable maintenance mode', isPublic: false },
    { settingKey: 'max_campaigns_per_user', settingValue: '100', settingType: 'NUMBER' as const, description: 'Maximum campaigns per user', isPublic: false },
    { settingKey: 'email_verification_required', settingValue: 'true', settingType: 'BOOLEAN' as const, description: 'Require email verification', isPublic: false },
  ]

  for (const setting of systemSettings) {
    await prisma.systemSetting.upsert({
      where: { settingKey: setting.settingKey },
      update: {
        settingValue: setting.settingValue,
        settingType: setting.settingType,
        description: setting.description,
        isPublic: setting.isPublic,
      },
      create: setting,
    })
  }
  console.log(`  ${systemSettings.length} system settings`)

  // =====================================================
  // AD FORMAT CONFIGS
  // =====================================================
  const adFormats = [
    { name: 'Banner', description: 'Standard display banner ad', dimensions: '300x250', basePrice: 2.50, minBudget: 50.00, isActive: true },
    { name: 'Interstitial', description: 'Full-screen interstitial ad', dimensions: '320x480', basePrice: 5.00, minBudget: 100.00, isActive: true },
    { name: 'Push', description: 'Push notification ad', dimensions: null, basePrice: 1.50, minBudget: 50.00, isActive: true },
  ]

  for (const format of adFormats) {
    await prisma.adFormatConfig.upsert({
      where: { name: format.name },
      update: {
        description: format.description,
        dimensions: format.dimensions,
        basePrice: format.basePrice,
        minBudget: format.minBudget,
        isActive: format.isActive,
      },
      create: format,
    })
  }
  console.log(`  ${adFormats.length} ad format configs`)

  // =====================================================
  // BOOST TYPE CONFIGS
  // =====================================================
  const boostTypes = [
    {
      name: 'Standard',
      description: 'Standard campaign delivery',
      multiplier: 1.00,
      features: ['Basic targeting', 'Standard support', 'Weekly reports'],
      isActive: true,
    },
    {
      name: 'Premium',
      description: 'Priority delivery with enhanced features',
      multiplier: 1.50,
      features: ['Advanced targeting', 'Priority support', 'Real-time analytics', 'A/B testing', 'Dedicated account manager'],
      isActive: true,
    },
  ]

  for (const boost of boostTypes) {
    await prisma.boostTypeConfig.upsert({
      where: { name: boost.name },
      update: {
        description: boost.description,
        multiplier: boost.multiplier,
        features: boost.features,
        isActive: boost.isActive,
      },
      create: boost,
    })
  }
  console.log(`  ${boostTypes.length} boost type configs`)

  // =====================================================
  // ADMIN USERS (Password: Admin123!)
  // =====================================================
  const adminPasswordHash = await bcrypt.hash('Admin123!', 12)

  const adminUsers = [
    { name: 'Super Admin', email: 'admin@myngly.com', password: adminPasswordHash, role: 'SUPER_ADMIN' as const, status: 'ACTIVE' as const, twoFactorEnabled: false },
    { name: 'Moderator', email: 'moderator@myngly.com', password: adminPasswordHash, role: 'MODERATOR' as const, status: 'ACTIVE' as const, twoFactorEnabled: false },
  ]

  const createdAdmins: Array<{ id: string; email: string }> = []
  for (const admin of adminUsers) {
    const result = await prisma.adminUser.upsert({
      where: { email: admin.email },
      update: {
        name: admin.name,
        password: admin.password,
        role: admin.role,
        status: admin.status,
        twoFactorEnabled: admin.twoFactorEnabled,
      },
      create: admin,
    })
    createdAdmins.push({ id: result.id, email: result.email })
  }
  const superAdminId = createdAdmins.find(a => a.email === 'admin@myngly.com')!.id
  const moderatorId = createdAdmins.find(a => a.email === 'moderator@myngly.com')!.id
  console.log(`  ${adminUsers.length} admin users`)

  // =====================================================
  // SAMPLE USERS (Password: Password123!)
  // =====================================================
  const userPasswordHash = await bcrypt.hash('Password123!', 12)
  const now = new Date()

  const users = [
    { name: 'John Doe', email: 'john@example.com', password: userPasswordHash, phone: '+1234567890', company: 'Acme Corp', status: 'ACTIVE' as const, role: 'ADVERTISER' as const, emailVerifiedAt: now },
    { name: 'Sarah Miller', email: 'sarah@brand.com', password: userPasswordHash, phone: '+1987654321', company: 'Brand Co', status: 'ACTIVE' as const, role: 'ADVERTISER' as const, emailVerifiedAt: now },
    { name: 'Mike Johnson', email: 'mike@company.com', password: userPasswordHash, phone: '+1122334455', company: 'Company Inc', status: 'ACTIVE' as const, role: 'ADVERTISER' as const, emailVerifiedAt: now },
    { name: 'Emily Chen', email: 'emily@startup.io', password: userPasswordHash, phone: '+1555666777', company: 'Startup.io', status: 'SUSPENDED' as const, role: 'ADVERTISER' as const, emailVerifiedAt: now },
    { name: 'Robert Brown', email: 'robert@agency.com', password: userPasswordHash, phone: '+1888999000', company: 'Ad Agency', status: 'ACTIVE' as const, role: 'ADVERTISER' as const, emailVerifiedAt: now },
  ]

  const createdUsers: Array<{ id: string; email: string }> = []
  for (const user of users) {
    const result = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        password: user.password,
        phone: user.phone,
        company: user.company,
        status: user.status,
        role: user.role,
        emailVerifiedAt: user.emailVerifiedAt,
        deletedAt: null,
      },
      create: user,
    })
    createdUsers.push({ id: result.id, email: result.email })
  }

  const userId = (email: string) => createdUsers.find(u => u.email === email)!.id
  console.log(`  ${users.length} users`)

  // =====================================================
  // NOTIFICATION SETTINGS
  // =====================================================
  for (const user of createdUsers) {
    await prisma.notificationSetting.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    })
  }
  console.log(`  ${createdUsers.length} notification settings`)

  // =====================================================
  // PAYMENT METHODS (Tokenized - no real card data)
  // =====================================================
  const paymentMethods = [
    { userId: userId('john@example.com'), cardType: 'visa', lastFour: '4242', expiryMonth: 12, expiryYear: 2027, cardholderName: 'John Doe', isDefault: true, stripePaymentMethodId: 'pm_test_visa_001' },
    { userId: userId('john@example.com'), cardType: 'mastercard', lastFour: '5555', expiryMonth: 6, expiryYear: 2026, cardholderName: 'John Doe', isDefault: false, stripePaymentMethodId: 'pm_test_mc_001' },
    { userId: userId('sarah@brand.com'), cardType: 'visa', lastFour: '1234', expiryMonth: 3, expiryYear: 2028, cardholderName: 'Sarah Miller', isDefault: true, stripePaymentMethodId: 'pm_test_visa_002' },
    { userId: userId('mike@company.com'), cardType: 'amex', lastFour: '0005', expiryMonth: 9, expiryYear: 2027, cardholderName: 'Mike Johnson', isDefault: true, stripePaymentMethodId: 'pm_test_amex_001' },
    { userId: userId('robert@agency.com'), cardType: 'visa', lastFour: '9876', expiryMonth: 1, expiryYear: 2028, cardholderName: 'Robert Brown', isDefault: true, stripePaymentMethodId: 'pm_test_visa_003' },
  ]

  const createdPaymentMethods: Array<{ id: string; stripePaymentMethodId: string | null }> = []
  for (const pm of paymentMethods) {
    // MongoDB doesn't have auto-increment IDs, so use create (no upsert by non-unique field)
    // Delete existing first to allow re-seeding
    await prisma.paymentMethod.deleteMany({
      where: { userId: pm.userId, stripePaymentMethodId: pm.stripePaymentMethodId },
    })
    const result = await prisma.paymentMethod.create({
      data: pm,
    })
    createdPaymentMethods.push({ id: result.id, stripePaymentMethodId: result.stripePaymentMethodId })
  }
  console.log(`  ${paymentMethods.length} payment methods`)

  // =====================================================
  // SAMPLE CAMPAIGNS
  // =====================================================
  const campaignData = [
    // John's campaigns
    {
      userId: userId('john@example.com'), name: 'Summer Sale 2026',
      adType: 'BRAND' as const, boostType: 'PREMIUM' as const, adFormat: 'BANNER' as const, status: 'ACTIVE' as const,
      adText: 'Get 50% off all summer items! Limited time offer.',
      destinationUrl: 'https://example.com/summer-sale',
      startDate: new Date('2026-01-15'), endDate: new Date('2026-02-15'),
      budget: 5000.00, spent: 2340.00, impressions: 125000, clicks: 3200, conversions: 150,
      reviewedBy: superAdminId, reviewedAt: new Date('2026-01-14T10:00:00'),
      deletedAt: null,
    },
    {
      userId: userId('john@example.com'), name: 'Brand Awareness Q1',
      adType: 'BRAND' as const, boostType: 'STANDARD' as const, adFormat: 'BANNER' as const, status: 'COMPLETED' as const,
      adText: 'Discover Acme Corp - Innovation for everyone',
      destinationUrl: 'https://example.com/about',
      startDate: new Date('2025-11-01'), endDate: new Date('2025-11-30'),
      budget: 1500.00, spent: 1500.00, impressions: 95000, clicks: 2100, conversions: 85,
      reviewedBy: superAdminId, reviewedAt: new Date('2025-10-30T14:00:00'),
      deletedAt: null,
    },
    // Sarah's campaigns
    {
      userId: userId('sarah@brand.com'), name: 'New Product Launch',
      adType: 'EVENT' as const, boostType: 'STANDARD' as const, adFormat: 'INTERSTITIAL' as const, status: 'REVIEW' as const,
      adText: 'Introducing our revolutionary new product!',
      destinationUrl: 'https://brand.com/new-product',
      startDate: new Date('2026-01-25'), endDate: new Date('2026-02-25'),
      budget: 2500.00, spent: 0.00, impressions: 0, clicks: 0, conversions: 0,
      reviewedBy: null, reviewedAt: null,
      deletedAt: null,
    },
    {
      userId: userId('sarah@brand.com'), name: 'Flash Sale Promo',
      adType: 'EVENT' as const, boostType: 'PREMIUM' as const, adFormat: 'INTERSTITIAL' as const, status: 'SCHEDULED' as const,
      adText: "24-hour flash sale! Don't miss out!",
      destinationUrl: 'https://brand.com/flash-sale',
      startDate: new Date('2026-02-01'), endDate: new Date('2026-02-07'),
      budget: 4000.00, spent: 0.00, impressions: 0, clicks: 0, conversions: 0,
      reviewedBy: superAdminId, reviewedAt: new Date('2026-01-20T16:00:00'),
      deletedAt: null,
    },
    // Mike's campaign
    {
      userId: userId('mike@company.com'), name: 'Holiday Special',
      adType: 'USER' as const, boostType: 'PREMIUM' as const, adFormat: 'PUSH' as const, status: 'PAUSED' as const,
      adText: 'Exclusive holiday deals for you!',
      destinationUrl: 'https://company.com/holiday',
      startDate: new Date('2025-12-20'), endDate: new Date('2026-01-10'),
      budget: 3000.00, spent: 1500.00, impressions: 75000, clicks: 1800, conversions: 92,
      reviewedBy: superAdminId, reviewedAt: new Date('2025-12-18T09:00:00'),
      deletedAt: null,
    },
    // Emily's rejected campaign
    {
      userId: userId('emily@startup.io'), name: 'Test Campaign',
      adType: 'USER' as const, boostType: 'STANDARD' as const, adFormat: 'PUSH' as const, status: 'REJECTED' as const,
      adText: 'Test ad content',
      destinationUrl: 'https://startup.io/test',
      startDate: new Date('2025-11-10'), endDate: new Date('2025-11-20'),
      budget: 500.00, spent: 0.00, impressions: 0, clicks: 0, conversions: 0,
      reviewedBy: moderatorId, reviewedAt: new Date('2025-11-09T11:00:00'),
      rejectionReason: 'Ad content does not meet quality guidelines. Please review and resubmit.',
      deletedAt: null,
    },
    // Robert's campaigns
    {
      userId: userId('robert@agency.com'), name: 'Agency Client A',
      adType: 'BRAND' as const, boostType: 'PREMIUM' as const, adFormat: 'BANNER' as const, status: 'ACTIVE' as const,
      adText: 'Premium brand experience awaits',
      destinationUrl: 'https://agency.com/client-a',
      startDate: new Date('2026-01-10'), endDate: new Date('2026-03-10'),
      budget: 10000.00, spent: 3500.00, impressions: 200000, clicks: 5500, conversions: 280,
      reviewedBy: superAdminId, reviewedAt: new Date('2026-01-09T08:00:00'),
      deletedAt: null,
    },
    {
      userId: userId('robert@agency.com'), name: 'Agency Client B',
      adType: 'EVENT' as const, boostType: 'STANDARD' as const, adFormat: 'INTERSTITIAL' as const, status: 'ACTIVE' as const,
      adText: 'Join us for an exclusive event',
      destinationUrl: 'https://agency.com/client-b',
      startDate: new Date('2026-01-15'), endDate: new Date('2026-02-28'),
      budget: 7500.00, spent: 2100.00, impressions: 150000, clicks: 4200, conversions: 195,
      reviewedBy: superAdminId, reviewedAt: new Date('2026-01-14T13:00:00'),
      deletedAt: null,
    },
  ]

  // Delete existing campaigns to allow re-seeding (no auto-increment IDs in MongoDB)
  await prisma.campaignDailyStats.deleteMany({})
  await prisma.campaignTargeting.deleteMany({})
  await prisma.transaction.deleteMany({})
  await prisma.campaign.deleteMany({})

  const createdCampaigns: Array<{ id: string; name: string }> = []
  for (const campaign of campaignData) {
    const result = await prisma.campaign.create({
      data: campaign,
    })
    createdCampaigns.push({ id: result.id, name: result.name })
  }

  const campaignId = (name: string) => createdCampaigns.find(c => c.name === name)!.id
  console.log(`  ${campaignData.length} campaigns`)

  // =====================================================
  // CAMPAIGN TARGETING
  // =====================================================
  const targetingData = [
    { campaignId: campaignId('Summer Sale 2026'), locationName: 'New York, NY', latitude: 40.7128, longitude: -74.0060, radiusKm: 25, ageMin: 18, ageMax: 45, gender: 'ALL' as const, interests: ['shopping', 'fashion', 'deals'] },
    { campaignId: campaignId('Brand Awareness Q1'), locationName: 'Los Angeles, CA', latitude: 34.0522, longitude: -118.2437, radiusKm: 30, ageMin: 25, ageMax: 55, gender: 'ALL' as const, interests: ['technology', 'business'] },
    { campaignId: campaignId('New Product Launch'), locationName: 'San Francisco, CA', latitude: 37.7749, longitude: -122.4194, radiusKm: 15, ageMin: 21, ageMax: 40, gender: 'ALL' as const, interests: ['tech', 'gadgets', 'innovation'] },
    { campaignId: campaignId('Flash Sale Promo'), locationName: 'Chicago, IL', latitude: 41.8781, longitude: -87.6298, radiusKm: 20, ageMin: 18, ageMax: 35, gender: 'FEMALE' as const, interests: ['shopping', 'beauty', 'lifestyle'] },
    { campaignId: campaignId('Holiday Special'), locationName: 'Miami, FL', latitude: 25.7617, longitude: -80.1918, radiusKm: 35, ageMin: 25, ageMax: 50, gender: 'ALL' as const, interests: ['travel', 'luxury', 'entertainment'] },
    { campaignId: campaignId('Test Campaign'), locationName: 'Seattle, WA', latitude: 47.6062, longitude: -122.3321, radiusKm: 10, ageMin: 18, ageMax: 30, gender: 'ALL' as const, interests: ['tech', 'startups'] },
    { campaignId: campaignId('Agency Client A'), locationName: 'Boston, MA', latitude: 42.3601, longitude: -71.0589, radiusKm: 40, ageMin: 30, ageMax: 60, gender: 'ALL' as const, interests: ['business', 'finance', 'luxury'] },
    { campaignId: campaignId('Agency Client B'), locationName: 'Austin, TX', latitude: 30.2672, longitude: -97.7431, radiusKm: 25, ageMin: 21, ageMax: 45, gender: 'ALL' as const, interests: ['events', 'music', 'entertainment'] },
  ]

  for (const targeting of targetingData) {
    await prisma.campaignTargeting.upsert({
      where: { campaignId: targeting.campaignId },
      update: {
        locationName: targeting.locationName,
        latitude: targeting.latitude,
        longitude: targeting.longitude,
        radiusKm: targeting.radiusKm,
        ageMin: targeting.ageMin,
        ageMax: targeting.ageMax,
        gender: targeting.gender,
        interests: targeting.interests,
      },
      create: targeting,
    })
  }
  console.log(`  ${targetingData.length} campaign targeting records`)

  // =====================================================
  // SAMPLE TRANSACTIONS
  // =====================================================
  const johnPmId = createdPaymentMethods.find(pm => pm.stripePaymentMethodId === 'pm_test_visa_001')!.id
  const sarahPmId = createdPaymentMethods.find(pm => pm.stripePaymentMethodId === 'pm_test_visa_002')!.id
  const mikePmId = createdPaymentMethods.find(pm => pm.stripePaymentMethodId === 'pm_test_amex_001')!.id
  const robertPmId = createdPaymentMethods.find(pm => pm.stripePaymentMethodId === 'pm_test_visa_003')!.id

  const transactions = [
    { userId: userId('john@example.com'), campaignId: campaignId('Summer Sale 2026'), paymentMethodId: johnPmId, type: 'CHARGE' as const, amount: 5000.00, currency: 'USD', status: 'COMPLETED' as const, description: 'Campaign: Summer Sale 2026' },
    { userId: userId('john@example.com'), campaignId: campaignId('Brand Awareness Q1'), paymentMethodId: johnPmId, type: 'CHARGE' as const, amount: 1500.00, currency: 'USD', status: 'COMPLETED' as const, description: 'Campaign: Brand Awareness Q1' },
    { userId: userId('sarah@brand.com'), campaignId: campaignId('New Product Launch'), paymentMethodId: sarahPmId, type: 'CHARGE' as const, amount: 2500.00, currency: 'USD', status: 'PENDING' as const, description: 'Campaign: New Product Launch' },
    { userId: userId('sarah@brand.com'), campaignId: campaignId('Flash Sale Promo'), paymentMethodId: sarahPmId, type: 'CHARGE' as const, amount: 4000.00, currency: 'USD', status: 'COMPLETED' as const, description: 'Campaign: Flash Sale Promo' },
    { userId: userId('mike@company.com'), campaignId: campaignId('Holiday Special'), paymentMethodId: mikePmId, type: 'CHARGE' as const, amount: 3000.00, currency: 'USD', status: 'COMPLETED' as const, description: 'Campaign: Holiday Special' },
    { userId: userId('robert@agency.com'), campaignId: campaignId('Agency Client A'), paymentMethodId: robertPmId, type: 'CHARGE' as const, amount: 10000.00, currency: 'USD', status: 'COMPLETED' as const, description: 'Campaign: Agency Client A' },
    { userId: userId('robert@agency.com'), campaignId: campaignId('Agency Client B'), paymentMethodId: robertPmId, type: 'CHARGE' as const, amount: 7500.00, currency: 'USD', status: 'COMPLETED' as const, description: 'Campaign: Agency Client B' },
  ]

  for (const tx of transactions) {
    await prisma.transaction.create({ data: tx })
  }
  console.log(`  ${transactions.length} transactions`)

  // =====================================================
  // DAILY STATS (Last 7 days for active campaigns)
  // =====================================================
  const today = new Date()
  const dayOffset = (days: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() - days)
    d.setHours(0, 0, 0, 0)
    return d
  }

  const dailyStats = [
    // Campaign: Summer Sale 2026
    { campaignId: campaignId('Summer Sale 2026'), statDate: dayOffset(6), impressions: 15000, clicks: 380, conversions: 18, spend: 280.00, ctr: 0.0253, cpc: 0.74, cpm: 18.67 },
    { campaignId: campaignId('Summer Sale 2026'), statDate: dayOffset(5), impressions: 18000, clicks: 450, conversions: 22, spend: 335.00, ctr: 0.0250, cpc: 0.74, cpm: 18.61 },
    { campaignId: campaignId('Summer Sale 2026'), statDate: dayOffset(4), impressions: 20000, clicks: 520, conversions: 25, spend: 385.00, ctr: 0.0260, cpc: 0.74, cpm: 19.25 },
    { campaignId: campaignId('Summer Sale 2026'), statDate: dayOffset(3), impressions: 19000, clicks: 490, conversions: 24, spend: 365.00, ctr: 0.0258, cpc: 0.74, cpm: 19.21 },
    { campaignId: campaignId('Summer Sale 2026'), statDate: dayOffset(2), impressions: 21000, clicks: 550, conversions: 28, spend: 410.00, ctr: 0.0262, cpc: 0.75, cpm: 19.52 },
    { campaignId: campaignId('Summer Sale 2026'), statDate: dayOffset(1), impressions: 22000, clicks: 580, conversions: 30, spend: 430.00, ctr: 0.0264, cpc: 0.74, cpm: 19.55 },
    { campaignId: campaignId('Summer Sale 2026'), statDate: dayOffset(0), impressions: 10000, clicks: 260, conversions: 13, spend: 195.00, ctr: 0.0260, cpc: 0.75, cpm: 19.50 },

    // Campaign: Agency Client A
    { campaignId: campaignId('Agency Client A'), statDate: dayOffset(6), impressions: 25000, clicks: 700, conversions: 35, spend: 450.00, ctr: 0.0280, cpc: 0.64, cpm: 18.00 },
    { campaignId: campaignId('Agency Client A'), statDate: dayOffset(5), impressions: 28000, clicks: 780, conversions: 40, spend: 500.00, ctr: 0.0279, cpc: 0.64, cpm: 17.86 },
    { campaignId: campaignId('Agency Client A'), statDate: dayOffset(4), impressions: 30000, clicks: 850, conversions: 44, spend: 540.00, ctr: 0.0283, cpc: 0.64, cpm: 18.00 },
    { campaignId: campaignId('Agency Client A'), statDate: dayOffset(3), impressions: 29000, clicks: 810, conversions: 42, spend: 520.00, ctr: 0.0279, cpc: 0.64, cpm: 17.93 },
    { campaignId: campaignId('Agency Client A'), statDate: dayOffset(2), impressions: 32000, clicks: 900, conversions: 48, spend: 580.00, ctr: 0.0281, cpc: 0.64, cpm: 18.13 },
    { campaignId: campaignId('Agency Client A'), statDate: dayOffset(1), impressions: 31000, clicks: 870, conversions: 45, spend: 560.00, ctr: 0.0281, cpc: 0.64, cpm: 18.06 },
    { campaignId: campaignId('Agency Client A'), statDate: dayOffset(0), impressions: 25000, clicks: 700, conversions: 36, spend: 450.00, ctr: 0.0280, cpc: 0.64, cpm: 18.00 },

    // Campaign: Agency Client B
    { campaignId: campaignId('Agency Client B'), statDate: dayOffset(6), impressions: 20000, clicks: 560, conversions: 26, spend: 280.00, ctr: 0.0280, cpc: 0.50, cpm: 14.00 },
    { campaignId: campaignId('Agency Client B'), statDate: dayOffset(5), impressions: 22000, clicks: 620, conversions: 29, spend: 310.00, ctr: 0.0282, cpc: 0.50, cpm: 14.09 },
    { campaignId: campaignId('Agency Client B'), statDate: dayOffset(4), impressions: 24000, clicks: 680, conversions: 32, spend: 340.00, ctr: 0.0283, cpc: 0.50, cpm: 14.17 },
    { campaignId: campaignId('Agency Client B'), statDate: dayOffset(3), impressions: 23000, clicks: 650, conversions: 31, spend: 325.00, ctr: 0.0283, cpc: 0.50, cpm: 14.13 },
    { campaignId: campaignId('Agency Client B'), statDate: dayOffset(2), impressions: 25000, clicks: 710, conversions: 34, spend: 355.00, ctr: 0.0284, cpc: 0.50, cpm: 14.20 },
    { campaignId: campaignId('Agency Client B'), statDate: dayOffset(1), impressions: 24000, clicks: 680, conversions: 33, spend: 340.00, ctr: 0.0283, cpc: 0.50, cpm: 14.17 },
    { campaignId: campaignId('Agency Client B'), statDate: dayOffset(0), impressions: 12000, clicks: 340, conversions: 16, spend: 170.00, ctr: 0.0283, cpc: 0.50, cpm: 14.17 },
  ]

  for (const stat of dailyStats) {
    await prisma.campaignDailyStats.upsert({
      where: {
        campaignId_statDate: {
          campaignId: stat.campaignId,
          statDate: stat.statDate,
        },
      },
      update: {
        impressions: stat.impressions,
        clicks: stat.clicks,
        conversions: stat.conversions,
        spend: stat.spend,
        ctr: stat.ctr,
        cpc: stat.cpc,
        cpm: stat.cpm,
      },
      create: stat,
    })
  }
  console.log(`  ${dailyStats.length} daily stats records`)

  // =====================================================
  // SUMMARY
  // =====================================================
  console.log('\nSeed data loaded successfully!')
  console.log(`  System settings: ${systemSettings.length}`)
  console.log(`  Ad formats: ${adFormats.length}`)
  console.log(`  Boost types: ${boostTypes.length}`)
  console.log(`  Admin users: ${adminUsers.length}`)
  console.log(`  Users: ${users.length}`)
  console.log(`  Notification settings: ${createdUsers.length}`)
  console.log(`  Payment methods: ${paymentMethods.length}`)
  console.log(`  Campaigns: ${campaignData.length}`)
  console.log(`  Campaign targeting: ${targetingData.length}`)
  console.log(`  Transactions: ${transactions.length}`)
  console.log(`  Daily stats: ${dailyStats.length}`)
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
