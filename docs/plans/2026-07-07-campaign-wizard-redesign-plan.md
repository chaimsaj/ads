# Campaign Wizard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the advertiser campaign-creation wizard (`myngly-ads/webapp`) around a shared, responsive `TargetPickerModal`, centralized wizard state, per-step/per-ad-type validation, and a visible "type is locked once created" rule.

**Architecture:** A new `useCampaignWizard` module becomes the single typed reader/writer for `localStorage.campaignWizard` and the source of per-step completeness predicates; a `WizardStepGuard` uses those predicates to stop users from deep-linking into an incomplete step; a new `TargetPickerModal` replaces the duplicated `SearchUser`/`SearchEvent` full pages and is opened directly from `SelectAdType`. Existing step components (`CreateAd`, `Targeting`, `Payment`, `Review`, `EditCampaign`) get targeted validation and error-display fixes, not rewrites.

**Tech Stack:** React 19, TypeScript 5.9 (strict), Vite 7, CSS Modules over `styles/tokens.css`. No test framework exists in this repo despite `CLAUDE.md` mentioning one — per user decision, this plan verifies with `npm run build` + `npm run lint` + manual browser testing at 3 breakpoints (375px / 768px / 1280px), not automated tests.

Spec: [`docs/plans/2026-07-07-campaign-wizard-redesign.md`](./2026-07-07-campaign-wizard-redesign.md)

**Note on commits:** Per `myngly-ads/CLAUDE.md` §5, commits happen only when the user asks. No task below includes a `git commit` step; changes are left staged/unstaged in the working tree for the user to review and commit when ready.

---

### Task 1: Shared `FieldError` and `AlertBanner` components

**Files:**
- Create: `webapp/src/components/ui/FieldError.tsx`
- Create: `webapp/src/components/ui/FieldError.module.css`
- Create: `webapp/src/components/ui/AlertBanner.tsx`
- Create: `webapp/src/components/ui/AlertBanner.module.css`
- Modify: `webapp/src/components/ui/index.ts`

These give every step a single, consistent way to show a field-level error (for raw inputs/textareas that aren't wrapped in the existing `Input` component, which already has its own `error` prop) and a submission-level error banner (replacing three different ad-hoc error `<div>`s in `Payment.tsx`, `Review.tsx`, `EditCampaign.tsx`).

- [ ] **Step 1: Create `FieldError.tsx`**

```tsx
interface FieldErrorProps {
  message: string;
}

export function FieldError({ message }: FieldErrorProps) {
  return <span className={styles.error} role="alert">{message}</span>;
}

import styles from './FieldError.module.css';
```

(Put the `import` at the top of the file per normal module ordering — written last above only to keep the snippet readable; the real file must start with the import.)

Final file content:

```tsx
import styles from './FieldError.module.css';

interface FieldErrorProps {
  message: string;
}

export function FieldError({ message }: FieldErrorProps) {
  return <span className={styles.error} role="alert">{message}</span>;
}
```

- [ ] **Step 2: Create `FieldError.module.css`** (mirrors `Input.module.css`'s `.error` rule so field errors look identical whether they come from `Input` or a raw element)

```css
.error {
  font-size: var(--text-sm);
  color: var(--color-error);
}
```

- [ ] **Step 3: Create `AlertBanner.tsx`**

```tsx
import styles from './AlertBanner.module.css';

interface AlertBannerProps {
  message: string;
}

export function AlertBanner({ message }: AlertBannerProps) {
  return <div className={styles.banner} role="alert">{message}</div>;
}
```

- [ ] **Step 4: Create `AlertBanner.module.css`** (mirrors `Payment.module.css`'s existing `.errorAlert` rule)

```css
.banner {
  padding: var(--space-4);
  margin-bottom: var(--space-4);
  background-color: var(--color-error-light);
  color: var(--color-error);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}
```

- [ ] **Step 5: Export both from the `ui` barrel**

Modify `webapp/src/components/ui/index.ts` — add two lines to the existing list:

```ts
export { Button } from './Button';
export { CityAutocomplete } from './CityAutocomplete';
export { Input } from './Input';
export { Card } from './Card';
export { Badge } from './Badge';
export { SelectionCard } from './SelectionCard';
export { Skeleton, SkeletonCard, SkeletonTableRow, SkeletonStatCard, SkeletonForm } from './Skeleton';
export { LocationMap } from './LocationMap';
export { FieldError } from './FieldError';
export { AlertBanner } from './AlertBanner';
```

- [ ] **Step 6: Verify it compiles**

Run: `cd webapp && npm run build`
Expected: build succeeds (these are unused-but-exported components at this point, which is fine — `noUnusedLocals`/`noUnusedParameters` only fire on unused *locals*, not unused *exports*).

---

### Task 2: `useCampaignWizard` — typed state, completeness predicates, type-switch cleanup

**Files:**
- Create: `webapp/src/hooks/useCampaignWizard.ts`

This is the foundation for Tasks 4 and 5. It does **not** replace the existing per-page `getWizardData`/`saveWizardData` helpers already in `SelectAdType.tsx`, `CreateAd.tsx`, `Targeting.tsx`, `AudienceTargeting.tsx`, `BrandDetails.tsx`, `SelectBoostType.tsx`, `SelectAdFormat.tsx`, `UserAdPreview.tsx`, `EventPreview.tsx`, `Payment.tsx`, `Review.tsx` — those already read/write the same `localStorage.campaignWizard` key correctly and are left alone except where a later task touches that specific file for a different reason. `SelectAdType.tsx` (Task 5) is the one page that switches to importing these functions instead of its local copies, since it needs the type-switch cleanup behavior.

- [ ] **Step 1: Create the file**

```ts
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
```

- [ ] **Step 2: Verify it compiles**

Run: `cd webapp && npm run build`
Expected: build succeeds (unused exports are fine at this point).

---

### Task 3: `TargetPickerModal` — shared profile/event picker

**Files:**
- Create: `webapp/src/components/campaign/TargetPickerModal.tsx`
- Create: `webapp/src/components/campaign/TargetPickerModal.module.css`
- Create: `webapp/src/components/campaign/index.ts`

Replaces the near-duplicate `SearchUser.tsx`/`SearchEvent.tsx` full pages with one modal, reusing the existing `usersApi`/`eventsApi` clients unchanged. Full-screen sheet ≤640px (matching the mobile breakpoint already used in `Campaign.module.css`), centered dialog above that.

- [ ] **Step 1: Create `TargetPickerModal.tsx`**

```tsx
import { useState, useEffect, useRef, useCallback, useId } from 'react';
import { Calendar, X } from 'lucide-react';
import { usersApi, type UserSearchResult } from '../../api/users';
import { eventsApi, type EventSearchResult } from '../../api/events';
import styles from './TargetPickerModal.module.css';

type TargetPickerMode = 'user' | 'event';

interface TargetPickerModalProps {
  mode: TargetPickerMode;
  open: boolean;
  onClose: () => void;
  onSelectUser?: (result: UserSearchResult) => void;
  onSelectEvent?: (result: EventSearchResult) => void;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatEventDate(iso: string): string {
  try {
    const d = new Date(iso);
    const date = d.toISOString().slice(0, 10);
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    const m = String(minutes).padStart(2, '0');
    return `${date} · ${h}:${m} ${ampm}`;
  } catch {
    return iso;
  }
}

export function TargetPickerModal({ mode, open, onClose, onSelectUser, onSelectEvent }: TargetPickerModalProps) {
  const [query, setQuery] = useState('');
  const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
  const [eventResults, setEventResults] = useState<EventSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  const runSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setUserResults([]);
      setEventResults([]);
      setSearchError(false);
      return;
    }
    setIsSearching(true);
    setSearchError(false);
    try {
      if (mode === 'user') {
        setUserResults(await usersApi.search(q));
      } else {
        setEventResults(await eventsApi.search(q));
      }
    } catch {
      setSearchError(true);
      setUserResults([]);
      setEventResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [mode]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setUserResults([]);
    setEventResults([]);
    setSearchError(false);
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(focusTimer);
  }, [open, mode]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, runSearch]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const title = mode === 'user' ? 'Who do you want to spotlight?' : 'Which event would you like to promote?';
  const placeholder = mode === 'user' ? 'Search by name...' : 'Search events...';
  const noResultsLabel = mode === 'user' ? 'No users found' : 'No events found';

  return (
    <div className={styles.overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>{title}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <input
          ref={inputRef}
          type="text"
          className={styles.searchInput}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className={styles.resultsArea}>
          {isSearching ? (
            <div className={styles.emptyState}>Searching...</div>
          ) : searchError ? (
            <div className={styles.emptyState}>
              Something went wrong.{' '}
              <button type="button" className={styles.retryBtn} onClick={() => runSearch(query)}>
                Try again
              </button>
            </div>
          ) : query.length < 2 ? (
            <div className={styles.emptyState}>Type at least 2 characters to search.</div>
          ) : mode === 'user' && userResults.length === 0 ? (
            <div className={styles.emptyState}>{noResultsLabel}</div>
          ) : mode === 'event' && eventResults.length === 0 ? (
            <div className={styles.emptyState}>{noResultsLabel}</div>
          ) : mode === 'user' ? (
            userResults.map((u) => (
              <button key={u.id} type="button" className={styles.resultRow} onClick={() => onSelectUser?.(u)}>
                <div className={styles.userAvatar}>
                  {u.avatar ? <img src={u.avatar} alt={u.name} className={styles.avatarImg} /> : <span>{initials(u.name)}</span>}
                </div>
                <div className={styles.resultInfo}>
                  <span className={styles.resultName}>{u.name}</span>
                  {u.company && <span className={styles.resultMeta}>{u.company}</span>}
                </div>
              </button>
            ))
          ) : (
            eventResults.map((evt) => (
              <button key={evt.id} type="button" className={styles.resultRow} onClick={() => onSelectEvent?.(evt)}>
                <div className={styles.eventThumb}>
                  {evt.bannerImage ? <img src={evt.bannerImage} alt={evt.name} className={styles.thumbImg} /> : <Calendar size={20} />}
                </div>
                <div className={styles.resultInfo}>
                  <span className={styles.resultName}>{evt.name}</span>
                  <span className={styles.resultMeta}>
                    {evt.address ? `${evt.address} · ` : ''}{formatEventDate(evt.date)}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `TargetPickerModal.module.css`**

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 9, 12, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-8);
}

.dialog {
  background: var(--color-white);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 480px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-8) var(--space-8) var(--space-4);
  border-bottom: 1px solid var(--color-neutral-100);
}

.title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--color-primary-800);
  margin: 0;
}

.closeBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
}

.closeBtn:hover {
  background: var(--color-neutral-100);
}

.searchInput {
  margin: var(--space-6) var(--space-8) 0;
  padding: var(--space-5) var(--space-6);
  font-family: var(--font-primary);
  font-size: var(--text-base);
  border: 1px solid var(--color-gray-400);
  border-radius: var(--radius-lg);
}

.searchInput:focus {
  outline: none;
  border-color: var(--color-primary-800);
  box-shadow: 0 0 0 3px rgba(44, 102, 110, 0.1);
}

.resultsArea {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-6) var(--space-8) var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.emptyState {
  padding: var(--space-8);
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.retryBtn {
  border: none;
  background: transparent;
  color: var(--color-primary-800);
  font-weight: var(--font-semibold);
  cursor: pointer;
  text-decoration: underline;
}

.resultRow {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  width: 100%;
  padding: var(--space-4);
  border: none;
  border-radius: var(--radius-lg);
  background: var(--color-white);
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}

.resultRow:hover,
.resultRow:focus-visible {
  background: var(--color-secondary-100);
}

.userAvatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-primary-100);
  color: var(--color-primary-800);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-semibold);
  font-size: var(--text-lg);
  flex-shrink: 0;
  overflow: hidden;
}

.avatarImg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.eventThumb {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  background: var(--color-secondary-100);
  color: var(--color-primary-800);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.thumbImg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.resultInfo {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.resultName {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-neutral-900);
}

.resultMeta {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

@media (max-width: 640px) {
  .overlay {
    padding: 0;
    align-items: stretch;
  }

  .dialog {
    max-width: none;
    max-height: none;
    height: 100%;
    border-radius: 0;
  }
}
```

- [ ] **Step 3: Create `components/campaign/index.ts`**

```ts
export { TargetPickerModal } from './TargetPickerModal';
```

(The `WizardStepGuard` export is added to this same barrel in Task 4.)

- [ ] **Step 4: Verify it compiles**

Run: `cd webapp && npm run build`
Expected: build succeeds.

---

### Task 4: `WizardStepGuard` and wiring it into every wizard route

**Files:**
- Create: `webapp/src/components/campaign/WizardStepGuard.tsx`
- Modify: `webapp/src/components/campaign/index.ts`
- Modify: `webapp/src/App.tsx`

Prevents reaching any `/campaign/new/*` step (other than the entry point) without the prerequisites the earlier steps establish. On failure, redirects to `/campaign/new` — the wizard's own start — rather than trying to resolve the exact first-incomplete step, which keeps the guard's logic simple and unambiguous.

- [ ] **Step 1: Create `WizardStepGuard.tsx`**

```tsx
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getWizardData, type CampaignWizardData } from '../../hooks/useCampaignWizard';

interface WizardStepGuardProps {
  isReady: (data: CampaignWizardData) => boolean;
  children: ReactNode;
}

export function WizardStepGuard({ isReady, children }: WizardStepGuardProps) {
  const data = getWizardData();
  if (!isReady(data)) {
    return <Navigate to="/campaign/new" replace />;
  }
  return <>{children}</>;
}
```

- [ ] **Step 2: Add it to the barrel**

Replace the content of `webapp/src/components/campaign/index.ts` with:

```ts
export { TargetPickerModal } from './TargetPickerModal';
export { WizardStepGuard } from './WizardStepGuard';
```

- [ ] **Step 3: Rewrite `App.tsx`**

Replace the full file content with:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './context/AuthContext';
import { WizardStepGuard } from './components/campaign';
import {
  isIdentityStepComplete,
  isTargetOrBrandStepComplete,
  isTypeCreativeStepComplete,
  isAdContentStepComplete,
  isTargetingStepComplete,
  isPaymentStepComplete,
} from './hooks/useCampaignWizard';
import {
  LandingPage,
  Dashboard,
  Reports,
  StripeSuccess,
  SignIn,
  SignUp,
  VerifyEmail,
  ForgotPassword,
  ResetPassword,
  SelectAdType,
  BrandDetails,
  AudienceTargeting,
  SelectBoostType,
  SelectAdFormat,
  CampaignDetails,
  CreateAd,
  UserAdPreview,
  EventPreview,
  Targeting,
  Payment,
  Review,
  EditCampaign,
  CampaignPerformance,
  ConversionTracking,
  Settings,
} from './pages';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/stripe-success" element={<StripeSuccess />} />

          {/* Auth Routes */}
          <Route path="/auth/signin" element={<SignIn />} />
          <Route path="/auth/signup" element={<SignUp />} />
          <Route path="/auth/verify-email" element={<VerifyEmail />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* Campaign Creation Flow */}
          <Route path="/campaign/new" element={<ProtectedRoute><SelectAdType /></ProtectedRoute>} />
          <Route
            path="/campaign/new/brand-details"
            element={
              <ProtectedRoute>
                <WizardStepGuard isReady={(d) => isIdentityStepComplete(d) && d.adType === 'brand'}>
                  <BrandDetails />
                </WizardStepGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/campaign/new/audience-targeting"
            element={
              <ProtectedRoute>
                <WizardStepGuard isReady={isTargetOrBrandStepComplete}>
                  <AudienceTargeting />
                </WizardStepGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/campaign/new/boost-type"
            element={
              <ProtectedRoute>
                <WizardStepGuard isReady={(d) => isTargetOrBrandStepComplete(d) && d.adType === 'user'}>
                  <SelectBoostType />
                </WizardStepGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/campaign/new/user-ad-preview"
            element={
              <ProtectedRoute>
                <WizardStepGuard isReady={(d) => isTypeCreativeStepComplete(d) && d.adType === 'user'}>
                  <UserAdPreview />
                </WizardStepGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/campaign/new/event-preview"
            element={
              <ProtectedRoute>
                <WizardStepGuard isReady={(d) => isTargetOrBrandStepComplete(d) && d.adType === 'event'}>
                  <EventPreview />
                </WizardStepGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/campaign/new/ad-format"
            element={
              <ProtectedRoute>
                <WizardStepGuard isReady={(d) => isTargetOrBrandStepComplete(d) && d.adType === 'brand'}>
                  <SelectAdFormat />
                </WizardStepGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/campaign/new/create-ad"
            element={
              <ProtectedRoute>
                <WizardStepGuard isReady={(d) => isTypeCreativeStepComplete(d) && d.adType === 'brand'}>
                  <CreateAd />
                </WizardStepGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/campaign/new/targeting"
            element={
              <ProtectedRoute>
                <WizardStepGuard isReady={isAdContentStepComplete}>
                  <Targeting />
                </WizardStepGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/campaign/new/payment"
            element={
              <ProtectedRoute>
                <WizardStepGuard isReady={isTargetingStepComplete}>
                  <Payment />
                </WizardStepGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/campaign/new/review"
            element={
              <ProtectedRoute>
                <WizardStepGuard isReady={isPaymentStepComplete}>
                  <Review />
                </WizardStepGuard>
              </ProtectedRoute>
            }
          />

          {/* Campaign Management */}
          <Route path="/campaign/:id" element={<ProtectedRoute><CampaignDetails /></ProtectedRoute>} />
          <Route path="/campaign/:id/edit" element={<ProtectedRoute><EditCampaign /></ProtectedRoute>} />
          <Route path="/campaign/:id/performance" element={<ProtectedRoute><CampaignPerformance /></ProtectedRoute>} />
          <Route path="/campaign/:id/tracking" element={<ProtectedRoute><ConversionTracking /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

Note this drops `SearchUser` and `SearchEvent` from the import list and removes their two `<Route>` entries — Task 5 deletes the now-unreferenced files. Building right after this task (before Task 5) will fail because `./pages` still exports `SearchUser`/`SearchEvent` unused — that's expected and resolved by Task 5; do not run the build check until Task 5 Step 5.

---

### Task 5: Wire `TargetPickerModal` into `SelectAdType`; remove `SearchUser`/`SearchEvent`

**Files:**
- Modify: `webapp/src/pages/campaign/SelectAdType.tsx` (full rewrite)
- Modify: `webapp/src/pages/campaign/Campaign.module.css` (add target-picker styles)
- Modify: `webapp/src/pages/campaign/AudienceTargeting.tsx:84-92` (`handleBack`)
- Modify: `webapp/src/pages/campaign/SelectBoostType.tsx:34-41` (`handleBack`)
- Modify: `webapp/src/pages/campaign/index.ts`
- Delete: `webapp/src/pages/campaign/SearchUser.tsx`
- Delete: `webapp/src/pages/campaign/SearchUser.module.css`
- Delete: `webapp/src/pages/campaign/SearchEvent.tsx`
- Delete: `webapp/src/pages/campaign/SearchEvent.module.css`

- [ ] **Step 1: Replace `SelectAdType.tsx`**

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, Building } from 'lucide-react';
import { WizardLayout } from '../../components/layout';
import { Input, SelectionCard, Button } from '../../components/ui';
import { TargetPickerModal } from '../../components/campaign';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import {
  getWizardData,
  saveWizardData,
  clearOtherTypeFields,
  type AdType,
  type CampaignWizardData,
} from '../../hooks/useCampaignWizard';
import type { UserSearchResult } from '../../api/users';
import type { EventSearchResult } from '../../api/events';
import styles from './Campaign.module.css';

type Target = UserSearchResult | EventSearchResult;

function isUserTarget(target: Target): target is UserSearchResult {
  return 'company' in target;
}

function targetFromWizardData(data: CampaignWizardData): Target | null {
  if (data.adType === 'user' && data.spotlightUserId && data.spotlightUsername) {
    return {
      id: data.spotlightUserId,
      name: data.spotlightUsername,
      company: data.spotlightUserCompany || null,
      avatar: data.spotlightUserAvatar || null,
    };
  }
  if (data.adType === 'event' && data.eventId && data.eventName) {
    return {
      id: data.eventId,
      code: data.eventCode || 0,
      name: data.eventName,
      address: data.eventAddress || null,
      date: data.eventDate || '',
      bannerImage: data.eventBannerImage || null,
    };
  }
  return null;
}

export function SelectAdType() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const existing = getWizardData();
  const [campaignName, setCampaignName] = useState(existing.name || '');
  const [selectedType, setSelectedType] = useState<AdType | null>(existing.adType || null);
  const [target, setTarget] = useState<Target | null>(targetFromWizardData(existing));
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleSelectType = (type: AdType) => {
    if (type !== selectedType) {
      clearOtherTypeFields(type);
      setTarget(targetFromWizardData(getWizardData()));
    }
    setSelectedType(type);
  };

  const handleNext = () => {
    saveWizardData({
      name: campaignName,
      adType: selectedType || undefined,
      ...(selectedType === 'user' && target && isUserTarget(target)
        ? {
            spotlightUserId: target.id,
            spotlightUsername: target.name,
            spotlightUserCompany: target.company || '',
            spotlightUserAvatar: target.avatar || '',
          }
        : {}),
      ...(selectedType === 'event' && target && !isUserTarget(target)
        ? {
            eventId: target.id,
            eventCode: target.code,
            eventName: target.name,
            eventAddress: target.address || '',
            eventDate: target.date,
            eventBannerImage: target.bannerImage || '',
          }
        : {}),
    });
    navigate(selectedType === 'brand' ? '/campaign/new/brand-details' : '/campaign/new/audience-targeting');
  };

  const adTypes = [
    { id: 'user' as AdType, title: 'Spotlighted User', description: 'Promote yourself to increase connection and visibility.', icon: <User size={48} /> },
    { id: 'event' as AdType, title: 'Featured Event', description: 'Attract more attendees to your event.', icon: <Calendar size={48} /> },
    { id: 'brand' as AdType, title: 'Promote your Brand', description: 'Boost visibility for your business or organization.', icon: <Building size={48} /> },
  ];

  const needsTarget = selectedType === 'user' || selectedType === 'event';

  return (
    <WizardLayout
      currentStep={1}
      totalSteps={3}
      onNext={handleNext}
      nextDisabled={!campaignName || !selectedType || (needsTarget && !target)}
      user={user || { name: '' }}
    >
      <div className={styles.wizardContent}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Campaign name</h2>
          <div className={styles.inputWrapper}>
            <Input
              placeholder="Enter campaign name"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              maxLength={200}
            />
            <span className={styles.charCount}>{campaignName.length}/200</span>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>What would you like to promote?</h2>
          <p className={styles.sectionSubtitle}>
            Select what you want to promote to help us reach the right audience.
          </p>

          <div className={styles.selectionGrid}>
            {adTypes.map((type) => (
              <SelectionCard
                key={type.id}
                title={type.title}
                description={type.description}
                icon={type.icon}
                selected={selectedType === type.id}
                onSelect={() => handleSelectType(type.id)}
              />
            ))}
          </div>

          {needsTarget && (
            <div className={styles.targetPicker}>
              <Button variant="outline" onClick={() => setPickerOpen(true)}>
                {target ? 'Change' : selectedType === 'user' ? 'Choose profile' : 'Choose event'}
              </Button>

              {target && (
                <div className={styles.targetCard}>
                  <div className={styles.targetAvatar}>
                    {isUserTarget(target) ? (
                      target.avatar ? <img src={target.avatar} alt={target.name} className={styles.targetAvatarImg} /> : <User size={20} />
                    ) : (
                      target.bannerImage ? <img src={target.bannerImage} alt={target.name} className={styles.targetAvatarImg} /> : <Calendar size={20} />
                    )}
                  </div>
                  <div className={styles.targetInfo}>
                    <span className={styles.targetName}>{target.name}</span>
                    <span className={styles.targetMeta}>
                      {isUserTarget(target) ? target.company || '' : target.address || ''}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedType === 'user' && (
        <TargetPickerModal
          mode="user"
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelectUser={(result) => { setTarget(result); setPickerOpen(false); }}
        />
      )}
      {selectedType === 'event' && (
        <TargetPickerModal
          mode="event"
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelectEvent={(result) => { setTarget(result); setPickerOpen(false); }}
        />
      )}
    </WizardLayout>
  );
}
```

- [ ] **Step 2: Append target-picker styles to `Campaign.module.css`**

Add at the end of the file (before or after the existing `@media` blocks — order doesn't matter since these are new class names):

```css
.targetPicker {
  margin-top: var(--space-6);
}

.targetCard {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  margin-top: var(--space-4);
  border: 1px solid var(--color-primary-200);
  border-radius: var(--radius-lg);
  background: var(--color-secondary-100);
  max-width: 500px;
}

.targetAvatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-primary-100);
  color: var(--color-primary-800);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.targetAvatarImg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.targetInfo {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.targetName {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-neutral-900);
}

.targetMeta {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
```

- [ ] **Step 3: Fix `AudienceTargeting.tsx`'s `handleBack`**

Replace (lines 84-92):

```tsx
  const handleBack = () => {
    if (adType === 'event') {
      navigate('/campaign/new/search-event');
    } else if (adType === 'brand') {
      navigate('/campaign/new/brand-details');
    } else {
      navigate('/campaign/new/search-user');
    }
  };
```

with:

```tsx
  const handleBack = () => {
    navigate(adType === 'brand' ? '/campaign/new/brand-details' : '/campaign/new');
  };
```

- [ ] **Step 4: Fix `SelectBoostType.tsx`'s `handleBack`**

Replace (lines 34-41):

```tsx
  const handleBack = () => {
    const adType = existing.adType as string;
    if (adType === 'user') {
      navigate('/campaign/new/audience-targeting');
    } else {
      navigate('/campaign/new/search-user');
    }
  };
```

with (this step is only ever reached for `adType === 'user'`, per the route guard added in Task 4, so the branch is dead code — remove it):

```tsx
  const handleBack = () => {
    navigate('/campaign/new/audience-targeting');
  };
```

- [ ] **Step 5: Update the `pages/campaign` barrel and delete the old files**

Replace `webapp/src/pages/campaign/index.ts` with:

```ts
export { SelectAdType } from './SelectAdType';
export { BrandDetails } from './BrandDetails';
export { AudienceTargeting } from './AudienceTargeting';
export { SelectBoostType } from './SelectBoostType';
export { SelectAdFormat } from './SelectAdFormat';
export { CampaignDetails } from './CampaignDetails';
export { CreateAd } from './CreateAd';
export { Targeting } from './Targeting';
export { Payment } from './Payment';
export { UserAdPreview } from './UserAdPreview';
export { EventPreview } from './EventPreview';
export { Review } from './Review';
export { EditCampaign } from './EditCampaign';
export { CampaignPerformance } from './CampaignPerformance';
export { ConversionTracking } from './ConversionTracking';
```

Delete these four files:

```bash
rm webapp/src/pages/campaign/SearchUser.tsx
rm webapp/src/pages/campaign/SearchUser.module.css
rm webapp/src/pages/campaign/SearchEvent.tsx
rm webapp/src/pages/campaign/SearchEvent.module.css
```

- [ ] **Step 6: Confirm no remaining references, then build and lint**

Run: `cd webapp && grep -rn "SearchUser\|SearchEvent\|search-user\|search-event" src`
Expected: no output.

Run: `npm run build && npm run lint`
Expected: both succeed with 0 errors.

---

### Task 6: `CreateAd.tsx` — real URL validation and banner MIME check

**Files:**
- Modify: `webapp/src/pages/campaign/CreateAd.tsx`

Two gaps: `link` accepts any non-empty string (no URL shape check), and the banner upload only checks file size in JS (the `accept` attribute is a UI hint, not a hard block — a user can still select a `.gif` via "All Files").

- [ ] **Step 1: Add a URL validator and accepted-type constant near the top of the file**

Replace:

```tsx
const MAX_BANNER_BYTES = 5 * 1024 * 1024;
```

with:

```tsx
const MAX_BANNER_BYTES = 5 * 1024 * 1024;
const ACCEPTED_BANNER_TYPES = ['image/jpeg', 'image/png'];

function isValidUrl(value: string): boolean {
  if (!value) return false;
  try {
    new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 2: Add the MIME check to `handleImageUpload`**

Replace:

```tsx
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BANNER_BYTES) {
      setUploadError('Image is too large. Please choose a file under 5 MB.');
      e.target.value = '';
      return;
    }
```

with:

```tsx
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_BANNER_TYPES.includes(file.type)) {
      setUploadError('Please upload a JPG or PNG image.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_BANNER_BYTES) {
      setUploadError('Image is too large. Please choose a file under 5 MB.');
      e.target.value = '';
      return;
    }
```

- [ ] **Step 3: Compute a link error and wire it into the `Input` and the Next button**

Replace:

```tsx
  const normalizedLink = formData.link && !/^https?:\/\//i.test(formData.link)
    ? `https://${formData.link}`
    : formData.link;
```

with:

```tsx
  const normalizedLink = formData.link && !/^https?:\/\//i.test(formData.link)
    ? `https://${formData.link}`
    : formData.link;

  const linkError = formData.link && !isValidUrl(formData.link)
    ? 'Enter a valid URL, e.g. https://example.com'
    : undefined;
```

Replace:

```tsx
      nextDisabled={!formData.adText || !formData.link || isUploading}
```

with:

```tsx
      nextDisabled={!formData.adText || !formData.link || !!linkError || isUploading}
```

Replace:

```tsx
              <Input
                placeholder="https://example.com"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              />
```

with:

```tsx
              <Input
                placeholder="https://example.com"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                error={linkError}
              />
```

- [ ] **Step 4: Build and lint**

Run: `cd webapp && npm run build && npm run lint`
Expected: both succeed with 0 errors.

---

### Task 7: `Targeting.tsx` — end date after start date

**Files:**
- Modify: `webapp/src/pages/campaign/Targeting.tsx`

- [ ] **Step 1: Compute a date-range error**

Replace:

```tsx
  const handleLocationResolved = useCallback((coords: { lat: number; lng: number }) => {
    setFormData((prev) => ({ ...prev, latitude: coords.lat, longitude: coords.lng }));
  }, []);
```

with:

```tsx
  const handleLocationResolved = useCallback((coords: { lat: number; lng: number }) => {
    setFormData((prev) => ({ ...prev, latitude: coords.lat, longitude: coords.lng }));
  }, []);

  const dateRangeError = formData.startDate && formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)
    ? 'End date must be after the start date.'
    : undefined;
```

- [ ] **Step 2: Wire the error into the End Date `Input` and the Next button**

Replace:

```tsx
      nextDisabled={!formData.address || !formData.startDate || !formData.endDate}
```

with:

```tsx
      nextDisabled={!formData.address || !formData.startDate || !formData.endDate || !!dateRangeError}
```

Replace:

```tsx
              <div className={styles.field}>
                <label className={styles.label}>End Date</label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
```

with:

```tsx
              <div className={styles.field}>
                <label className={styles.label}>End Date</label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  error={dateRangeError}
                />
              </div>
```

- [ ] **Step 3: Build and lint**

Run: `cd webapp && npm run build && npm run lint`
Expected: both succeed with 0 errors.

---

### Task 8: `Payment.tsx` — explicit budget minimum and `AlertBanner`

**Files:**
- Modify: `webapp/src/pages/campaign/Payment.tsx`

- [ ] **Step 1: Compute a budget error and use it to gate submit**

Replace:

```tsx
  const handleSubmit = async () => {
    if (!selectedCard || !budget) return;
```

with:

```tsx
  const budgetError = budget && parseFloat(budget) < 10 ? 'Minimum budget is $10.' : undefined;

  const handleSubmit = async () => {
    if (!selectedCard || !budget || parseFloat(budget) < 10) return;
```

- [ ] **Step 2: Disable Next when the budget is under the minimum**

Replace:

```tsx
      nextDisabled={!selectedCard || !budget || processing}
```

with:

```tsx
      nextDisabled={!selectedCard || !budget || !!budgetError || processing}
```

- [ ] **Step 3: Show the budget error under the field**

Replace:

```tsx
            <div className={styles.budgetInput}>
              <span className={styles.currency}>$</span>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className={styles.budgetField}
                min="10"
                step="10"
                disabled={processing}
              />
              <span className={styles.budgetSuffix}>USD</span>
            </div>
```

with:

```tsx
            <div className={styles.budgetInput}>
              <span className={styles.currency}>$</span>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className={styles.budgetField}
                min="10"
                step="10"
                disabled={processing}
              />
              <span className={styles.budgetSuffix}>USD</span>
            </div>
            {budgetError && <FieldError message={budgetError} />}
```

- [ ] **Step 4: Import `FieldError` and `AlertBanner`, and swap the ad-hoc error `<div>` for `AlertBanner`**

Replace:

```tsx
import { WizardLayout } from '../../components/layout';
import { Button } from '../../components/ui';
```

with:

```tsx
import { WizardLayout } from '../../components/layout';
import { Button, FieldError, AlertBanner } from '../../components/ui';
```

Replace:

```tsx
        {error && (
          <div className={styles.errorAlert}>
            {error}
          </div>
        )}
```

with:

```tsx
        {error && <AlertBanner message={error} />}
```

(The `.errorAlert` rule in `Payment.module.css` becomes unused after this — leave the CSS file alone; a repo-wide unused-CSS sweep is out of scope for this change.)

- [ ] **Step 5: Build and lint**

Run: `cd webapp && npm run build && npm run lint`
Expected: both succeed with 0 errors.

---

### Task 9: `Review.tsx` — `AlertBanner` for submission errors

**Files:**
- Modify: `webapp/src/pages/campaign/Review.tsx`

- [ ] **Step 1: Import `AlertBanner` and use `clearWizardData`**

Replace:

```tsx
import { campaignsApi } from '../../api/campaigns';
import type { CampaignEstimate } from '../../api/campaigns';
import { isApiError } from '../../api/client';
import { invalidate } from '../../lib/queryCache';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import styles from './Review.module.css';
```

with:

```tsx
import { campaignsApi } from '../../api/campaigns';
import type { CampaignEstimate } from '../../api/campaigns';
import { isApiError } from '../../api/client';
import { invalidate } from '../../lib/queryCache';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { clearWizardData } from '../../hooks/useCampaignWizard';
import { AlertBanner } from '../../components/ui';
import styles from './Review.module.css';
```

- [ ] **Step 2: Replace the raw `localStorage.removeItem` call**

Replace:

```tsx
      localStorage.removeItem('campaignWizard');
      invalidate('webapp:dashboard');
```

with:

```tsx
      clearWizardData();
      invalidate('webapp:dashboard');
```

- [ ] **Step 3: Swap the inline-styled error `<div>` for `AlertBanner`**

Replace:

```tsx
        {submitError && (
          <div style={{ color: 'red', padding: '1rem', marginBottom: '1rem' }}>{submitError}</div>
        )}
```

with:

```tsx
        {submitError && <AlertBanner message={submitError} />}
```

- [ ] **Step 4: Build and lint**

Run: `cd webapp && npm run build && npm run lint`
Expected: both succeed with 0 errors.

---

### Task 10: `EditCampaign.tsx` — fix the save-error/load-error mix-up, add the type-lock badge, MIME check

**Files:**
- Modify: `webapp/src/pages/campaign/EditCampaign.tsx`
- Modify: `webapp/src/pages/campaign/EditCampaign.module.css`

Bug found during the audit: `if (error) { return <full-page-error-screen> }` fires for **both** "failed to load the campaign" (correct — there's nothing to show) **and** "failed to save changes" (wrong — this replaces the whole edit form, including the advertiser's unsaved edits on screen, with a generic error page and a "Back to Campaign Details" link). The two cases need different treatment: a load failure has no campaign to show, so the full-page state is right; a save failure happens while the campaign is loaded and the form should stay visible with an inline error.

- [ ] **Step 1: Import `AlertBanner`, `Badge`**

Replace:

```tsx
import { Button, Input } from '../../components/ui';
```

with:

```tsx
import { Button, Input, AlertBanner, Badge } from '../../components/ui';
```

- [ ] **Step 2: Only show the full-page error screen when there is no loaded campaign**

Replace:

```tsx
  if (error) {
    return (
      <div className={styles.page}>
        <Header variant="dashboard" user={user || { name: '' }} />
        <main className={styles.main}>
          <div className={styles.container} style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--color-error, red)', marginBottom: '1rem' }}>{error}</p>
            <Link to={`/campaign/${id}`}>Back to Campaign Details</Link>
          </div>
        </main>
        <Footer variant="dashboard" />
      </div>
    );
  }
```

with:

```tsx
  if (error && !campaign) {
    return (
      <div className={styles.page}>
        <Header variant="dashboard" user={user || { name: '' }} />
        <main className={styles.main}>
          <div className={styles.container} style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--color-error, red)', marginBottom: '1rem' }}>{error}</p>
            <Link to={`/campaign/${id}`}>Back to Campaign Details</Link>
          </div>
        </main>
        <Footer variant="dashboard" />
      </div>
    );
  }
```

- [ ] **Step 3: Show a save-error banner inline once the form itself renders**

Replace:

```tsx
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h1 className={styles.title}>Edit Campaign</h1>
              <p className={styles.subtitle}>
                Make changes to your campaign settings.
              </p>
            </div>
```

with:

```tsx
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h1 className={styles.title}>Edit Campaign</h1>
              <p className={styles.subtitle}>
                Make changes to your campaign settings.
              </p>
              {campaign && (
                <div className={styles.typeLock}>
                  <Badge variant="default">
                    {adType === 'user' ? 'User Spotlight' : adType === 'event' ? 'Event Promotion' : 'Brand Campaign'}
                  </Badge>
                  <span className={styles.typeLockNote}>To change the campaign type, create a new campaign.</span>
                </div>
              )}
            </div>
```

Replace:

```tsx
          <div className={styles.tabs}>
```

with:

```tsx
          {error && <AlertBanner message={error} />}

          <div className={styles.tabs}>
```

- [ ] **Step 4: Add the MIME-type check to the banner upload**

Replace:

```tsx
                        <input
                          type="file"
                          accept="image/jpeg,image/png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > MAX_BANNER_BYTES) {
                              setBannerError('Image is too large. Please choose a file under 5 MB.');
                              e.target.value = '';
                              return;
                            }
                            setBannerError(null);
                            updateField('bannerImage', file);
                          }}
                          className={styles.fileInput}
                        />
```

with:

```tsx
                        <input
                          type="file"
                          accept="image/jpeg,image/png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (!['image/jpeg', 'image/png'].includes(file.type)) {
                              setBannerError('Please upload a JPG or PNG image.');
                              e.target.value = '';
                              return;
                            }
                            if (file.size > MAX_BANNER_BYTES) {
                              setBannerError('Image is too large. Please choose a file under 5 MB.');
                              e.target.value = '';
                              return;
                            }
                            setBannerError(null);
                            updateField('bannerImage', file);
                          }}
                          className={styles.fileInput}
                        />
```

- [ ] **Step 5: Add the type-lock badge styles**

Add to the end of `EditCampaign.module.css`:

```css
.typeLock {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-top: var(--space-3);
  flex-wrap: wrap;
}

.typeLockNote {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
```

- [ ] **Step 6: Build and lint**

Run: `cd webapp && npm run build && npm run lint`
Expected: both succeed with 0 errors.

---

### Task 11: Final verification pass

**Files:** none (verification only).

- [ ] **Step 1: Full build and lint**

Run: `cd webapp && npm run build && npm run lint`
Expected: both succeed with 0 errors, 0 warnings treated as errors.

- [ ] **Step 2: Start the dev server**

Run: `npm run dev` (leave running)
Expected: server on `http://localhost:5173`.

- [ ] **Step 3: Manual walkthrough at desktop width (1280px)**

For each of the three ad types (`user`, `event`, `brand`), go through `/campaign/new` end to end:
- Confirm the "Choose profile"/"Choose event" button opens the modal, search returns results, clicking a result selects it and closes the modal, and the selected card renders on the same page.
- Confirm "Next" is disabled until a target is chosen (user/event) or until a brand name is set (brand).
- Confirm switching ad type after picking a target clears the previous target (re-select "User", pick a profile, go back to type selection, switch to "Brand" and back to "User" — the previously picked profile should be gone).
- Confirm the URL, date-range, and budget validations added in Tasks 6-8 show their error text and block "Next"/"Submit Campaign" appropriately.
- Confirm typing a `/campaign/new/payment` or `/campaign/new/review` URL directly (without going through the wizard) redirects to `/campaign/new`.
- Submit one full campaign of each type successfully through to the confirmation screen.

- [ ] **Step 4: Manual walkthrough at tablet width (768px) and mobile width (375px)**

Resize the browser (or use device emulation) to 768px and 375px and repeat the ad-type walkthrough above, paying particular attention to:
- The `TargetPickerModal` becomes a full-screen sheet at ≤640px and a centered dialog above that.
- No horizontal scrolling or overlapping text on any wizard step.
- The selected-target card and its avatar/thumbnail remain legible and don't overflow.

- [ ] **Step 5: Edit-flow check**

Open an existing draft or rejected campaign's edit page (`/campaign/:id/edit`) for each ad type:
- Confirm the campaign-type badge and "create a new campaign" note render.
- Confirm there is still no way to change `adType` from this screen.
- Trigger a save failure (e.g. temporarily disconnect network, or submit an invalid budget if the backend rejects it) and confirm the form stays visible with an `AlertBanner` instead of being replaced by the full-page error screen.

- [ ] **Step 6: Fix anything Steps 3-5 turn up**

Tasks 1-10 did not touch `CreateAd.module.css`, `Targeting.module.css`, `Payment.module.css`, or `EditCampaign.module.css` beyond what's listed above — those files were not read closely enough during planning to promise specific responsive fixes. If Step 4 finds a real overflow/overlap/unreadable-text issue in one of them at 768px or 375px, fix it directly in that CSS module (adding a `@media (max-width: 1024px)` / `@media (max-width: 640px)` block following the pattern already used in `Campaign.module.css`) before moving on.

- [ ] **Step 7: Report results**

Summarize pass/fail for each check in Steps 3-5, and list anything fixed in Step 6. Do not claim the feature is complete until every check has been run and passed.
