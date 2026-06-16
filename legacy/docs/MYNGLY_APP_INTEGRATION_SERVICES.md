# Myngly App Integration Services - Full Specification

**Date:** March 31, 2026
**Purpose:** Define every service needed to fully integrate the Myngly Ads Platform (webapp + admin + API) with the Myngly consumer mobile app.
**Reference:** `system_architecture.md`

---

## Table of Contents

1. [Current State Summary](#1-current-state-summary)
2. [Critical Gaps](#2-critical-gaps)
3. [Services: Myngly App → Ads API (Data Ingestion)](#3-services-myngly-app--ads-api-data-ingestion)
4. [Services: Ads API → Myngly App (Ad Delivery)](#4-services-ads-api--myngly-app-ad-delivery)
5. [Services: Myngly App → Ads API (Tracking & Events)](#5-services-myngly-app--ads-api-tracking--events)
6. [Services: Push Notifications (Ads API → Myngly App)](#6-services-push-notifications-ads-api--myngly-app)
7. [Services: Image & Asset Management](#7-services-image--asset-management)
8. [Services: Webhook / Realtime Sync](#8-services-webhook--realtime-sync)
9. [Schema Changes Required](#9-schema-changes-required)
10. [Backend Validator Changes](#10-backend-validator-changes)
11. [Implementation Priority](#11-implementation-priority)
12. [API Contract Summary Table](#12-api-contract-summary-table)

---

## 1. Current State Summary

### What EXISTS today

| Area | Status | Notes |
|------|--------|-------|
| Mobile campaign list | Working | `GET /api/v1/mobile/campaigns` with geofencing |
| Mobile campaign detail | Working | `GET /api/v1/mobile/campaigns/:id` |
| Event search (webapp) | Partial | `GET /api/v1/events/search` — searches LOCAL DB only |
| User search (webapp) | Partial | `GET /api/v1/users/search` — searches LOCAL advertiser accounts only |
| Impression tracking | Working | `POST /api/v1/tracking/impression` |
| Click tracking | Working | `POST /api/v1/tracking/click` |
| Conversion tracking | Working | `POST /api/v1/tracking/conversion` + pixel |
| UTM parameter appending | Working | `utm_source=myngly&utm_campaign={id}` |
| Ad format/boost config | Working | `GET /api/v1/ads/formats`, `/boost-types` |

### What is MISSING or BROKEN

| Area | Issue | Impact |
|------|-------|--------|
| Event-campaign link | Frontend sends `eventId`, backend silently discards it | Cannot identify which event a campaign promotes |
| User-campaign link | Frontend sends `spotlightUserId`, backend discards it | Cannot identify which user a campaign spotlights |
| Event data source | Events are LOCAL only — no sync with Myngly app's real events | Advertisers can only search hardcoded test events |
| User data source | User search returns advertiser accounts, not Myngly consumer users | Spotlight feature cannot target real app users |
| Push notifications | DB preferences exist, no Firebase/FCM implementation | PUSH ad format cannot deliver notifications |
| Image storage | Banner images stored as URLs, no upload/CDN service | No reliable asset pipeline for ad creatives |
| Ad rendering spec | Mobile endpoint returns raw fields, no rendering instructions | App must guess how to display each ad type/format |
| Campaign schedule sync | No way to notify app when campaigns go active/paused | App must poll for changes |
| Deep linking | No deep link generation for ads | Ads cannot link to specific app screens |
| Frequency capping | No cap on how many times a user sees the same ad | Users may see the same ad repeatedly |

---

## 2. Critical Gaps

### Gap 1: Event Data Does Not Persist to Campaign

**Current flow:**
```
SearchEvent.tsx → user picks event → localStorage → Review.tsx → POST /api/v1/campaigns
                                                                      ↓
                                                        Backend validator STRIPS eventId
                                                        Campaign created WITHOUT event link
```

**Required fix:** Add `eventId` field to Campaign model + validator + mobile DTO.

### Gap 2: Spotlight User Data Does Not Persist

**Same pattern as events.** Frontend collects `spotlightUserId`, backend discards it.

**Required fix:** Add `spotlightUserId` field to Campaign model + validator + mobile DTO.

### Gap 3: Events/Users Come From Wrong Database

The webapp searches the Ads platform's LOCAL MongoDB for events and users. But the real events and real consumer users live in the **Myngly app's database** (separate system).

**Required fix:** Either:
- **Option A (Recommended):** Create sync services that import events/users from Myngly app DB into local Ads DB
- **Option B:** Create proxy endpoints that query the Myngly app DB directly at search time

---

## 3. Services: Myngly App → Ads API (Data Ingestion)

These services pull data FROM the Myngly consumer app INTO the ads platform so advertisers can reference real events and users.

### 3.1 Event Sync Service

**Purpose:** Import promotable events from the Myngly app into the Ads platform's `events` collection.

**Endpoint:** `POST /api/v1/sync/events` (or scheduled job)

**Source:** Myngly app database — events collection

**Fields to import:**

| Field | Type | Description |
|-------|------|-------------|
| `externalId` | String | Original event ID in Myngly app |
| `code` | Int | Unique event code |
| `name` | String | Event name |
| `description` | String | Event description |
| `address` | String | Event location/venue |
| `city` | String | City name |
| `state` | String | State code |
| `latitude` | Float | Event venue latitude |
| `longitude` | Float | Event venue longitude |
| `date` | DateTime | Event date/time |
| `endDate` | DateTime | Event end date (optional) |
| `bannerImage` | String | Event banner image URL |
| `organizerName` | String | Event organizer/host name |
| `organizerId` | String | Organizer's user ID in Myngly |
| `category` | String | Event category (networking, career fair, social, etc.) |
| `capacity` | Int | Max attendees |
| `attendeeCount` | Int | Current RSVP count |
| `status` | String | Event status (upcoming, ongoing, past, cancelled) |
| `isPromotable` | Boolean | Whether event owner allows ad promotion |

**Sync behavior:**
- Upsert by `externalId` (create if new, update if exists)
- Only import events with `status = upcoming` and `isPromotable = true`
- Run on schedule (every 15 minutes) or via webhook from Myngly app
- Soft-delete events that are cancelled or past

**API for webapp (existing, enhanced):**
- `GET /api/v1/events/search?q={query}&city={city}&category={category}`
- Returns events with attendee count, category, organizer info

### 3.2 User Sync Service (For Spotlight)

**Purpose:** Import promotable user profiles from the Myngly app so advertisers can select users to spotlight.

**Endpoint:** `POST /api/v1/sync/users` (or scheduled job)

**Source:** Myngly app database — users/profiles collection

**Fields to import:**

| Field | Type | Description |
|-------|------|-------------|
| `externalUserId` | String | Original user ID in Myngly app |
| `name` | String | Display name |
| `headline` | String | Professional headline |
| `company` | String | Current company/university |
| `avatar` | String | Profile photo URL |
| `city` | String | User's city |
| `state` | String | User's state |
| `university` | String | University name (if student) |
| `graduationYear` | Int | Expected graduation (if student) |
| `industry` | String | Professional industry |
| `goals` | String[] | Networking goals (from Myngly profile) |
| `interests` | String[] | User interests |
| `connectionCount` | Int | Number of connections |
| `isSpotlightable` | Boolean | Whether user allows being featured in ads |

**Sync behavior:**
- Upsert by `externalUserId`
- Only import users with `isSpotlightable = true`
- Exclude deactivated/banned users
- Schedule: hourly or webhook

**Note:** These are NOT advertiser accounts — they are Myngly consumer app users who have opted in to be featured.

### 3.3 Interest/Goal Taxonomy Sync

**Purpose:** Keep the advertiser webapp's interest and goal options in sync with the Myngly app's available categories.

**Endpoint:** `GET /api/v1/sync/taxonomy`

**Data to sync:**

| Category | Examples |
|----------|---------|
| Goals | Network, Find internship, Full-time job, Find mentors, Invest in projects, Hire employees, etc. |
| Industries | Technology, Finance, Healthcare, Education, etc. |
| Education Levels | Undergraduate, Graduate, MBA, PhD, etc. |

**Usage:** AudienceTargeting.tsx currently hardcodes these lists. Should fetch from synced taxonomy.

---

## 4. Services: Ads API → Myngly App (Ad Delivery)

These services deliver campaign ads TO the Myngly mobile app for display to end users.

### 4.1 Campaign List (EXISTS — needs enhancement)

**Current:** `GET /api/v1/mobile/campaigns`

**Enhancements needed:**

| Field | Currently | Needed |
|-------|-----------|--------|
| `eventId` | Not included | Include for EVENT type campaigns |
| `eventName` | Not included | Include for EVENT type campaigns |
| `eventDate` | Not included | Include for EVENT type campaigns |
| `spotlightUserId` | Not included | Include for USER type campaigns |
| `spotlightUserName` | Not included | Include for USER type campaigns |
| `spotlightUserAvatar` | Not included | Include for USER type campaigns |
| `renderSpec` | Not included | Include rendering instructions (see 4.3) |
| `priority` | Not included | Boost type multiplier for ad ordering |
| `frequencyCap` | Not included | Max impressions per user per day |
| `callToAction` | Not included | CTA button text ("Learn More", "Apply Now", etc.) |

### 4.2 Campaign Detail (EXISTS — needs enhancement)

**Current:** `GET /api/v1/mobile/campaigns/:id`

**Add:**
- Full event object (if EVENT type): name, date, address, bannerImage, organizer
- Full spotlight user object (if USER type): name, avatar, headline, company
- Rendering specification (see 4.3)
- UTM-enriched destination URL (already implemented via `utm-builder.ts`)

### 4.3 Ad Rendering Specification Service (NEW)

**Purpose:** Tell the mobile app exactly how to render each ad, so ad display is consistent and doesn't require app-side guessing.

**Endpoint:** Included as `renderSpec` field in campaign responses

**Spec by Ad Type + Format:**

#### USER + BANNER
```json
{
  "layout": "user_spotlight_card",
  "sections": {
    "avatar": { "url": "https://...", "shape": "circle", "size": 80 },
    "name": "Sara Johnson",
    "headline": "Computer Science @ Rice University",
    "company": "Myngly Inc",
    "badge": "Sponsored",
    "adText": "Connect with top talent...",
    "cta": { "text": "Connect", "url": "https://..." },
    "interests": ["Network", "Find internship"]
  },
  "placement": "connections_feed",
  "style": { "highlightColor": "#5bb5b5", "borderStyle": "subtle" }
}
```

#### EVENT + BANNER
```json
{
  "layout": "event_promotion_card",
  "sections": {
    "bannerImage": { "url": "https://...", "aspectRatio": "16:9" },
    "eventName": "Tech Career Fair 2026",
    "eventDate": "2026-07-15T18:00:00.000Z",
    "eventAddress": "Houston, TX",
    "badge": "Sponsored",
    "adText": "Don't miss this opportunity...",
    "cta": { "text": "RSVP", "url": "https://..." }
  },
  "placement": "events_feed",
  "style": { "highlightColor": "#5bb5b5" }
}
```

#### BRAND + INTERSTITIAL
```json
{
  "layout": "fullscreen_overlay",
  "sections": {
    "bannerImage": { "url": "https://...", "aspectRatio": "4:3" },
    "adText": "Apply now to our university...",
    "cta": { "text": "Learn More", "url": "https://..." },
    "closeButton": { "position": "top-right", "delay": 3 }
  },
  "placement": "interstitial",
  "style": { "backgroundColor": "rgba(0,0,0,0.9)" }
}
```

#### BRAND + PUSH
```json
{
  "layout": "push_notification",
  "sections": {
    "title": "Myngly",
    "body": "Check out this opportunity...",
    "image": { "url": "https://...", "type": "thumbnail" },
    "cta": { "url": "https://...", "deepLink": "myngly://campaign/abc123" }
  },
  "placement": "push",
  "style": {}
}
```

### 4.4 Frequency Capping Service (NEW)

**Purpose:** Prevent users from seeing the same ad too many times.

**Endpoint:** Part of campaign list filtering logic

**Parameters to add to Campaign model:**
- `frequencyCapPerUser` (Int, default 3) — max impressions per user per 24h
- `frequencyCapTotal` (Int, nullable) — max total impressions before auto-pause

**Logic:**
- Mobile app sends `userId` or `deviceId` with campaign list request
- Backend filters out campaigns that have exceeded the user's frequency cap
- Based on `ConversionEvent` count for type=impression per user per day

### 4.5 Deep Link Service (NEW)

**Purpose:** Generate deep links so ads can open specific screens in the Myngly app.

**Deep link patterns:**

| Ad Type | Deep Link | Opens |
|---------|-----------|-------|
| USER | `myngly://profile/{spotlightUserId}` | Spotlight user's profile |
| EVENT | `myngly://event/{eventId}` | Event detail page |
| BRAND | `myngly://web?url={encodedDestinationUrl}` | In-app browser with destination URL |

**Implementation:**
- Generate deep link as part of the render spec
- Include both deep link (for in-app navigation) and web URL (fallback)
- Track deep link opens as clicks

---

## 5. Services: Myngly App → Ads API (Tracking & Events)

### 5.1 Impression Tracking (EXISTS)

`POST /api/v1/tracking/impression`

**Current fields:** `campaignId, userId?, deviceId?, adFormat?`

**Add:**
- `placement` (String) — where in the app the ad was shown (feed, events_tab, interstitial, push)
- `sessionId` (String) — app session for grouping events
- `viewDuration` (Int) — milliseconds the ad was visible (for viewability metrics)
- `screenWidth` / `screenHeight` (Int) — device screen size for rendering analytics

### 5.2 Click Tracking (EXISTS)

`POST /api/v1/tracking/click`

**Current fields:** `campaignId, userId?, deviceId?, adFormat?, destinationUrl?`

**Add:**
- `clickTarget` (String) — what was clicked: "cta_button", "banner_image", "profile_card", "event_card"
- `deepLinkUsed` (Boolean) — whether deep link or web URL was used

### 5.3 Conversion Tracking (EXISTS)

`POST /api/v1/tracking/conversion` + pixel

**No changes needed** — already supports `application` and `deposit` types.

### 5.4 Ad Dismissal Tracking (NEW)

**Purpose:** Track when users dismiss/close/skip ads (important for relevance tuning).

**Endpoint:** `POST /api/v1/tracking/dismiss`

**Body:**
```json
{
  "campaignId": "string (ObjectId)",
  "userId": "string (optional)",
  "deviceId": "string (optional)",
  "reason": "closed | skipped | not_interested | reported",
  "viewDuration": 1500
}
```

**Usage:** Feed into frequency capping. If a user dismisses an ad, reduce its priority for that user.

### 5.5 Ad Engagement Tracking (NEW)

**Purpose:** Track engagement beyond clicks — shares, saves, event RSVPs triggered from ads.

**Endpoint:** `POST /api/v1/tracking/engagement`

**Body:**
```json
{
  "campaignId": "string",
  "userId": "string (optional)",
  "type": "share | save | rsvp | connect",
  "metadata": {}
}
```

---

## 6. Services: Push Notifications (Ads API → Myngly App)

### 6.1 Push Notification Delivery Service (NEW — HIGH PRIORITY)

**Purpose:** Deliver PUSH format ads as actual push notifications to users within the campaign's targeting area.

**Required infrastructure:**
- Firebase Cloud Messaging (FCM) integration
- Device token storage (from Myngly app)
- Notification queue/scheduler

**Endpoint to receive device tokens:**
`POST /api/v1/mobile/devices/register`

**Body:**
```json
{
  "deviceToken": "string (FCM token)",
  "userId": "string (Myngly user ID)",
  "platform": "ios | android",
  "appVersion": "string",
  "latitude": 29.7604,
  "longitude": -95.3698
}
```

**Device model to add:**
```prisma
model DeviceRegistration {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  userId      String   @map("user_id")
  deviceToken String   @map("device_token")
  platform    String   // 'ios' | 'android'
  appVersion  String?  @map("app_version")
  latitude    Float?
  longitude   Float?
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@unique([userId, deviceToken])
  @@index([latitude, longitude])
  @@map("device_registrations")
}
```

**Push delivery flow:**
```
Campaign status → ACTIVE
     ↓
Scheduler picks up PUSH format campaigns
     ↓
Query DeviceRegistrations within campaign's targeting radius
     ↓
Filter by demographics (age, gender, interests) if available
     ↓
Apply frequency cap (max 1 push per user per campaign per day)
     ↓
Send via FCM with campaign render spec as payload
     ↓
Record impression event
```

### 6.2 Push Notification Content Format

**FCM payload structure:**
```json
{
  "notification": {
    "title": "Myngly",
    "body": "{campaign.adText}",
    "image": "{campaign.bannerImage}"
  },
  "data": {
    "campaignId": "abc123",
    "type": "ad_push",
    "deepLink": "myngly://campaign/abc123",
    "destinationUrl": "https://university.edu/apply",
    "trackingUrl": "https://api.myngly.com/api/v1/tracking/click"
  }
}
```

---

## 7. Services: Image & Asset Management

### 7.1 Campaign Image Upload Service (NEW)

**Purpose:** Allow advertisers to upload banner images directly instead of providing external URLs.

**Endpoint:** `POST /api/v1/campaigns/upload-image`

**Flow:**
```
Advertiser uploads image in webapp
     ↓
Multer receives file (max 5MB, JPG/PNG/WebP)
     ↓
Image resized to standard dimensions per ad format:
  - Banner: 1200x628 (1.91:1)
  - Interstitial: 1080x1920 (9:16)
  - Push thumbnail: 512x512 (1:1)
     ↓
Stored in cloud storage (Azure Blob Storage / AWS S3)
     ↓
CDN URL returned and saved to campaign.bannerImage
```

**Required infrastructure:**
- Azure Blob Storage container (or S3 bucket)
- Image processing library (sharp)
- CDN in front of storage

### 7.2 Image Optimization Service

**Purpose:** Serve images at the right size for each device.

**Endpoint:** `GET /api/v1/images/:id?w={width}&h={height}&q={quality}`

**Features:**
- On-the-fly resize via query params
- WebP conversion for smaller payload
- Cache headers for CDN caching
- Placeholder/fallback for missing images

---

## 8. Services: Webhook / Realtime Sync

### 8.1 Campaign Status Change Webhook (NEW)

**Purpose:** Notify the Myngly app when campaign status changes (activated, paused, completed, etc.)

**Endpoint on Myngly app side:** Configurable webhook URL

**Payload sent by Ads API:**
```json
{
  "event": "campaign.status_changed",
  "timestamp": "2026-03-31T12:00:00Z",
  "data": {
    "campaignId": "abc123",
    "previousStatus": "SCHEDULED",
    "newStatus": "ACTIVE",
    "adType": "EVENT",
    "adFormat": "BANNER",
    "targeting": { "locationName": "Houston, TX", "radiusKm": 25 }
  }
}
```

**Triggered on:** `ACTIVE`, `PAUSED`, `COMPLETED` status transitions

**Usage:** Myngly app can proactively update its local ad cache instead of polling.

### 8.2 Event Update Webhook (Myngly App → Ads API)

**Purpose:** Myngly app notifies Ads platform when events change (cancelled, date change, venue change).

**Endpoint on Ads API:** `POST /api/v1/webhooks/events`

**Payload:**
```json
{
  "event": "event.updated",
  "data": {
    "externalId": "myngly_event_123",
    "changes": { "date": "2026-08-01T18:00:00Z", "status": "cancelled" }
  }
}
```

**Action:** Update local event record. If event cancelled, optionally notify advertiser and pause related campaigns.

### 8.3 User Profile Update Webhook (Myngly App → Ads API)

**Purpose:** Keep spotlight user data current (name change, avatar update, account deactivation).

**Endpoint on Ads API:** `POST /api/v1/webhooks/users`

---

## 9. Schema Changes Required

### 9.1 Campaign Model Additions

```prisma
model Campaign {
  // ... existing fields ...

  // Event association (for EVENT ad type)
  eventId           String?  @map("event_id") @db.ObjectId
  event             Event?   @relation(fields: [eventId], references: [id], onDelete: NoAction, onUpdate: NoAction)

  // Spotlight user association (for USER ad type)
  spotlightUserId   String?  @map("spotlight_user_id")
  spotlightUserName String?  @map("spotlight_user_name")
  spotlightUserAvatar String? @map("spotlight_user_avatar")

  // Rendering & delivery
  callToAction      String?  @map("call_to_action")  // CTA button text
  frequencyCapPerUser Int    @default(3) @map("frequency_cap_per_user")

  // Deep linking
  deepLink          String?  @map("deep_link")
}
```

### 9.2 Event Model Enhancements

```prisma
model Event {
  // ... existing fields ...

  // Sync with Myngly app
  externalId    String?  @unique @map("external_id")
  description   String?
  city          String?
  state         String?
  latitude      Float?
  longitude     Float?
  endDate       DateTime? @map("end_date")
  organizerName String?  @map("organizer_name")
  organizerId   String?  @map("organizer_id")
  category      String?
  capacity      Int?
  attendeeCount Int      @default(0) @map("attendee_count")
  eventStatus   String   @default("upcoming") @map("event_status")
  isPromotable  Boolean  @default(true) @map("is_promotable")
  syncedAt      DateTime? @map("synced_at")

  // Reverse relation
  campaigns     Campaign[]
}
```

### 9.3 New Models

```prisma
model SpotlightUser {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  externalUserId  String   @unique @map("external_user_id")
  name            String
  headline        String?
  company         String?
  avatar          String?
  city            String?
  state           String?
  university      String?
  industry        String?
  goals           Json?    // String[]
  interests       Json?    // String[]
  connectionCount Int      @default(0) @map("connection_count")
  isSpotlightable Boolean  @default(true) @map("is_spotlightable")
  syncedAt        DateTime @default(now()) @map("synced_at")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@map("spotlight_users")
}

model DeviceRegistration {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  userId      String   @map("user_id")
  deviceToken String   @map("device_token")
  platform    String
  appVersion  String?  @map("app_version")
  latitude    Float?
  longitude   Float?
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@unique([userId, deviceToken])
  @@index([latitude, longitude])
  @@map("device_registrations")
}
```

---

## 10. Backend Validator Changes

### 10.1 Campaign Create Validator

Add to `src/domains/campaign/validators/campaign.validator.ts`:

```typescript
// Currently missing — must accept these optional fields:
eventId: z.string().regex(objectIdRegex).optional(),
spotlightUserId: z.string().optional(),
spotlightUserName: z.string().max(255).optional(),
spotlightUserAvatar: z.string().url().optional(),
callToAction: z.string().max(50).optional(),
frequencyCapPerUser: z.number().int().min(1).max(100).optional(),
```

### 10.2 Campaign Update Validator

Same fields as create, all optional.

### 10.3 Mobile Campaign List Validator

Add optional filters:
```typescript
userId: z.string().optional(),    // for frequency capping
deviceId: z.string().optional(),  // for frequency capping
placement: z.enum(['feed', 'events_tab', 'interstitial', 'push']).optional(),
```

---

## 11. Implementation Priority

### Phase 1: Fix Data Persistence (CRITICAL — 1-2 days)

| Task | Why |
|------|-----|
| Add `eventId` to Campaign model + validator | Event campaigns lose their event reference |
| Add `spotlightUserId/Name/Avatar` to Campaign model + validator | User campaigns lose their spotlight reference |
| Include event/user data in mobile campaign responses | App needs this to render ads correctly |
| Fix frontend mappers to send these fields properly | Ensure data flows end-to-end |

### Phase 2: Event & User Sync (HIGH — 3-5 days)

| Task | Why |
|------|-----|
| Design sync protocol with Myngly app team | Agree on data format, auth, frequency |
| Build Event sync service + enhanced Event model | Replace hardcoded test events with real data |
| Build SpotlightUser model + sync service | Enable real user spotlight selection |
| Update SearchEvent/SearchUser to use synced data | Advertisers see real events/users |

### Phase 3: Ad Rendering Spec (HIGH — 2-3 days)

| Task | Why |
|------|-----|
| Define render spec JSON schema per ad type/format | App needs structured instructions, not raw fields |
| Build render spec generator in mobile campaign service | Auto-generate spec from campaign data |
| Add render spec to mobile API responses | App receives complete rendering instructions |
| Add deep link generation | Ads can navigate to specific app screens |

### Phase 4: Push Notifications (MEDIUM — 3-5 days)

| Task | Why |
|------|-----|
| Integrate Firebase Admin SDK | Required for sending push notifications |
| Build device registration endpoint | App must register FCM tokens |
| Build push delivery scheduler | Campaigns with PUSH format need actual delivery |
| Add frequency capping logic | Prevent notification spam |
| Track push opens as clicks | Attribution for push campaigns |

### Phase 5: Image Pipeline (MEDIUM — 2-3 days)

| Task | Why |
|------|-----|
| Set up Azure Blob Storage | Reliable image hosting |
| Build image upload endpoint | Replace URL-only approach |
| Add image resizing (sharp) | Optimize for different ad formats |
| Serve via CDN | Fast global delivery |

### Phase 6: Webhooks & Realtime (LOW — 2-3 days)

| Task | Why |
|------|-----|
| Campaign status change webhook | App can update ad cache proactively |
| Event update webhook receiver | Keep event data current |
| User profile update webhook receiver | Keep spotlight data current |

---

## 12. API Contract Summary Table

### Services the Myngly App CONSUMES (Ads API provides)

| # | Endpoint | Method | Auth | Purpose | Status |
|---|----------|--------|------|---------|--------|
| 1 | `/api/v1/mobile/campaigns` | GET | API Key | List active ads with geo-filter | EXISTS — needs event/user/renderSpec fields |
| 2 | `/api/v1/mobile/campaigns/:id` | GET | API Key | Full ad detail for rendering | EXISTS — needs enhancement |
| 3 | `/api/v1/mobile/devices/register` | POST | API Key | Register FCM push token | NEW |
| 4 | `/api/v1/tracking/impression` | POST | None | Record ad impression | EXISTS — add placement, viewDuration |
| 5 | `/api/v1/tracking/click` | POST | None | Record ad click | EXISTS — add clickTarget |
| 6 | `/api/v1/tracking/conversion` | POST | None | Record conversion event | EXISTS |
| 7 | `/api/v1/tracking/dismiss` | POST | None | Record ad dismissal | NEW |
| 8 | `/api/v1/tracking/engagement` | POST | None | Record ad engagement (share/save) | NEW |
| 9 | `/api/v1/tracking/pixel/:id.png` | GET | None | 1x1 conversion pixel | EXISTS |

### Services the Ads API CONSUMES (Myngly App provides)

| # | Service | Direction | Purpose | Status |
|---|---------|-----------|---------|--------|
| 10 | Event data sync | Myngly → Ads | Import real events for advertising | NEW |
| 11 | User profile sync | Myngly → Ads | Import user profiles for spotlight | NEW |
| 12 | Interest/goal taxonomy | Myngly → Ads | Sync targeting categories | NEW |
| 13 | Event update webhook | Myngly → Ads | Notify event changes/cancellations | NEW |
| 14 | User profile webhook | Myngly → Ads | Notify profile changes | NEW |

### Services the Ads API PUSHES (To Myngly App)

| # | Service | Direction | Purpose | Status |
|---|---------|-----------|---------|--------|
| 15 | Push notifications (FCM) | Ads → Devices | Deliver PUSH format ads | NEW |
| 16 | Campaign status webhook | Ads → Myngly | Notify campaign activations/pauses | NEW |

### Internal Services (Webapp/Admin ↔ Ads API)

| # | Endpoint | Purpose | Status |
|---|----------|---------|--------|
| 17 | `POST /api/v1/campaigns/upload-image` | Upload ad creative image | NEW |
| 18 | `GET /api/v1/images/:id` | Serve optimized images | NEW |
| 19 | `POST /api/v1/campaigns/estimate` | Forward-looking performance estimates | EXISTS |
| 20 | `GET /api/v1/campaigns/:id/performance` | Campaign performance report | EXISTS |
| 21 | `GET /api/v1/campaigns/performance/overview` | Aggregate stats | EXISTS |

---

## Appendix: Integration Architecture Diagram

```
+---------------------------+          +---------------------------+
|   Myngly Consumer App     |          |   Myngly Ads Platform     |
|   (iOS / Android)         |          |   (Express + MongoDB)     |
+---------------------------+          +---------------------------+
|                           |          |                           |
|  Events DB ───────────────────sync──→  events collection        |
|  Users DB  ───────────────────sync──→  spotlight_users collection|
|  Taxonomy  ───────────────────sync──→  targeting categories     |
|                           |          |                           |
|  Display ads ←────────────────GET──── /mobile/campaigns         |
|  Track impression ────────────POST──→ /tracking/impression      |
|  Track click ─────────────────POST──→ /tracking/click           |
|  Track dismiss ───────────────POST──→ /tracking/dismiss         |
|  Register device ─────────────POST──→ /mobile/devices/register  |
|                           |          |                           |
|  Receive push ←───────────────FCM─── Push delivery scheduler    |
|                           |          |                           |
|  Event changed ───────────────POST──→ /webhooks/events          |
|  User changed ────────────────POST──→ /webhooks/users           |
|                           |          |                           |
+---------------------------+          +---------------------------+
                                              ↑         ↑
                                              |         |
                                    +---------+--+  +---+----------+
                                    | Advertiser |  | Admin Panel  |
                                    | Webapp     |  | (management) |
                                    +------------+  +--------------+
```

---

## Notes & Decisions Pending

1. **Myngly App DB access:** Does the Ads API connect directly to the Myngly app's MongoDB, or does the Myngly app expose its own REST API? This determines whether sync is DB-to-DB or API-to-API.

2. **Authentication for sync:** If API-to-API, what auth mechanism? Shared API key, OAuth2 service-to-service, or mutual TLS?

3. **Image storage provider:** Azure Blob Storage (matches current Azure deployment) or AWS S3?

4. **FCM project:** Does a Firebase project already exist for the Myngly app, or must one be created?

5. **Deep link scheme:** Confirm the Myngly app's deep link URL scheme (assumed `myngly://` but needs verification).

6. **Spotlight user consent:** How does a Myngly user opt in/out of being spotlightable? Is this a profile setting in the Myngly app?

7. **Event promotability:** How does an event organizer mark their event as promotable? Is this a setting in the Myngly app's event creation flow?
