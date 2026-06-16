# Myngly Ads Admin - Complete Test Documentation

**Version:** 1.0.0
**Date:** January 23, 2026
**Status:** CRITICAL - No tests currently exist in the codebase

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Assessment](#2-current-state-assessment)
3. [Test Strategy](#3-test-strategy)
4. [Manual Test Cases](#4-manual-test-cases)
5. [Automated Test Specifications](#5-automated-test-specifications)
6. [E2E Test Scenarios](#6-e2e-test-scenarios)
7. [Test Infrastructure Setup](#7-test-infrastructure-setup)
8. [Coverage Requirements](#8-coverage-requirements)
9. [Testing Schedule](#9-testing-schedule)
10. [Appendices](#10-appendices)

---

## 1. Executive Summary

### 1.1 Critical Finding

**The entire codebase has ZERO test coverage.**

| Project | Test Files | Coverage |
|---------|------------|----------|
| Advertiser Webapp | 0 | 0% |
| API_Node | 0 | 0% |
| Admin Panel | 0 | 0% |
| Admin API | 0 | 0% |

### 1.2 Risk Assessment

| Risk | Severity | Impact |
|------|----------|--------|
| No regression protection | CRITICAL | Breaking changes undetected |
| No validation of business logic | CRITICAL | Financial/data integrity risks |
| No security test coverage | HIGH | Vulnerability exposure |
| No API contract validation | HIGH | Integration failures |

### 1.3 Recommended Priority

1. **Immediate:** Authentication & Payment flows
2. **High:** Campaign CRUD operations
3. **Medium:** UI components
4. **Low:** Utility functions

---

## 2. Current State Assessment

### 2.1 Projects Inventory

```
Myngly_ads_admin/
├── src/                          # Advertiser Webapp (React + TypeScript)
│   ├── components/ui/            # 6 UI components (0 tests)
│   ├── components/layout/        # 3 layout components (0 tests)
│   ├── pages/                    # 15+ page components (0 tests)
│   ├── hooks/                    # 1 custom hook (0 tests)
│   ├── utils/                    # Validation utilities (0 tests)
│   └── api/                      # API client (0 tests)
│
├── API_Node/src/                 # Backend API (Node.js + Express)
│   ├── controllers/              # 12 controllers (0 tests)
│   ├── services/                 # 15 services (0 tests)
│   ├── repositories/             # 8 repositories (0 tests)
│   ├── middleware/               # 5 middleware (0 tests)
│   ├── validators/               # 7 validators (0 tests)
│   └── utils/                    # 5 utilities (0 tests)
│
└── ads_internal_admin_1_22/      # Admin Panel
    ├── src/                      # Admin UI (0 tests)
    └── Node_API/                 # Admin API (0 tests)
```

### 2.2 Critical Paths Without Tests

| Flow | Files Involved | Risk Level |
|------|---------------|------------|
| User Registration | SignUp.tsx, auth.service.ts, auth.controller.ts | CRITICAL |
| User Login | SignIn.tsx, auth.service.ts, jwt.ts | CRITICAL |
| Payment Processing | Payment.tsx, payment.service.ts, Stripe_*.ts | CRITICAL |
| Campaign Creation | CreateAd.tsx, campaign.service.ts | HIGH |
| Email Verification | VerifyEmail.tsx, auth.service.ts | HIGH |

---

## 3. Test Strategy

### 3.1 Testing Pyramid

```
                    ┌─────────┐
                    │   E2E   │  10% - Critical user flows
                    │  Tests  │
                  ┌─┴─────────┴─┐
                  │ Integration │  30% - API & DB operations
                  │    Tests    │
               ┌──┴─────────────┴──┐
               │    Unit Tests     │  60% - Components, services, utils
               └───────────────────┘
```

### 3.2 Technology Stack

| Layer | Frontend | Backend |
|-------|----------|---------|
| Unit | Vitest + React Testing Library | Vitest |
| Integration | MSW (Mock Service Worker) | Supertest + Prisma |
| E2E | Playwright | Playwright |

### 3.3 Coverage Targets

| Metric | Target | Minimum |
|--------|--------|---------|
| Line Coverage | 85% | 80% |
| Branch Coverage | 80% | 75% |
| Function Coverage | 90% | 85% |
| Statement Coverage | 85% | 80% |

---

## 4. Manual Test Cases

### 4.1 Authentication Module

#### TC-AUTH-001: User Registration - Happy Path

| Field | Value |
|-------|-------|
| **ID** | TC-AUTH-001 |
| **Title** | Successful user registration |
| **Priority** | P0 - Critical |
| **Preconditions** | User is not registered, on /auth/signup page |

**Steps:**
| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Enter valid email: test@example.com | Email field populated |
| 2 | Enter first name: John | First name field populated |
| 3 | Enter last name: Doe | Last name field populated |
| 4 | Enter password: Test@123456 | Password field populated (masked) |
| 5 | Check "Agree to Terms" checkbox | Checkbox checked |
| 6 | Click "Continue" button | Redirect to /auth/verify-email |
| 7 | Verify email sent | Email received with verification code |

**Postconditions:** User record created with emailVerifiedAt = null

---

#### TC-AUTH-002: User Registration - Invalid Email

| Field | Value |
|-------|-------|
| **ID** | TC-AUTH-002 |
| **Title** | Registration with invalid email format |
| **Priority** | P1 - High |
| **Preconditions** | User is on /auth/signup page |

**Steps:**
| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Enter invalid email: "notanemail" | Email field populated |
| 2 | Click outside the field | Error message: "Please enter a valid email" |
| 3 | Enter another invalid: "test@" | Error persists |
| 4 | Click "Continue" button | Form does not submit |

---

#### TC-AUTH-003: User Registration - Weak Password

| Field | Value |
|-------|-------|
| **ID** | TC-AUTH-003 |
| **Title** | Registration with weak password |
| **Priority** | P1 - High |
| **Preconditions** | User is on /auth/signup page |

**Steps:**
| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Enter password: "12345" | Password field populated |
| 2 | Tab to next field | Error: "Password must be at least 8 characters" |
| 3 | Enter: "password" | No uppercase/number error |
| 4 | Enter: "Password1" | No special character error (if required) |
| 5 | Enter: "Password1!" | No error, valid password |

---

#### TC-AUTH-004: User Login - Happy Path

| Field | Value |
|-------|-------|
| **ID** | TC-AUTH-004 |
| **Title** | Successful user login |
| **Priority** | P0 - Critical |
| **Preconditions** | User registered and email verified |

**Steps:**
| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Navigate to /auth/signin | Sign in page displayed |
| 2 | Enter valid email | Email field populated |
| 3 | Enter valid password | Password field populated (masked) |
| 4 | Click "Sign in" button | Redirect to /dashboard |
| 5 | Verify JWT token stored | Token in localStorage/cookie |
| 6 | Verify user menu shows name | User name displayed in header |

---

#### TC-AUTH-005: User Login - Invalid Credentials

| Field | Value |
|-------|-------|
| **ID** | TC-AUTH-005 |
| **Title** | Login with wrong password |
| **Priority** | P0 - Critical |
| **Preconditions** | User registered with email test@example.com |

**Steps:**
| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Enter email: test@example.com | Email populated |
| 2 | Enter wrong password: WrongPass1! | Password populated |
| 3 | Click "Sign in" | Error: "Invalid email or password" |
| 4 | Verify no redirect | Stays on /auth/signin |
| 5 | Verify no token stored | localStorage/cookie empty |

---

#### TC-AUTH-006: User Login - Unverified Email

| Field | Value |
|-------|-------|
| **ID** | TC-AUTH-006 |
| **Title** | Login attempt with unverified email |
| **Priority** | P1 - High |
| **Preconditions** | User registered but emailVerifiedAt = null |

**Steps:**
| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Enter valid email and password | Fields populated |
| 2 | Click "Sign in" | Error: "Please verify your email address first" |
| 3 | Verify link to resend verification | Link present |

---

#### TC-AUTH-007: Email Verification

| Field | Value |
|-------|-------|
| **ID** | TC-AUTH-007 |
| **Title** | Email verification with valid code |
| **Priority** | P0 - Critical |
| **Preconditions** | User registered, verification email received |

**Steps:**
| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Open verification email | Email contains 6-digit code |
| 2 | Navigate to /auth/verify-email | Verification page shown |
| 3 | Enter 6-digit code | Code fields populated |
| 4 | Submit code | Success message displayed |
| 5 | Verify redirect | Redirected to /auth/signin or /dashboard |
| 6 | Verify database | emailVerifiedAt is now set |

---

#### TC-AUTH-008: Forgot Password Flow

| Field | Value |
|-------|-------|
| **ID** | TC-AUTH-008 |
| **Title** | Password reset complete flow |
| **Priority** | P1 - High |
| **Preconditions** | User registered with verified email |

**Steps:**
| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Click "Forgot password?" on signin | Navigate to /auth/forgot-password |
| 2 | Enter registered email | Email populated |
| 3 | Click "Send reset link" | Success message shown |
| 4 | Check email inbox | Reset email received |
| 5 | Click reset link | Navigate to reset password page |
| 6 | Enter new password twice | Both fields match |
| 7 | Submit | Success, redirect to signin |
| 8 | Login with new password | Successfully logged in |

---

### 4.2 Campaign Module

#### TC-CAMP-001: Create Campaign - Complete Flow

| Field | Value |
|-------|-------|
| **ID** | TC-CAMP-001 |
| **Title** | Create campaign with all steps |
| **Priority** | P0 - Critical |
| **Preconditions** | User logged in, on dashboard |

**Steps:**
| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Click "Create New Ad" | Navigate to /campaign/select-ad-type |
| 2 | Select "Brand" ad type | Card highlighted, continue enabled |
| 3 | Click Continue | Navigate to /campaign/select-boost-type |
| 4 | Select "Premium" boost | Card highlighted |
| 5 | Click Continue | Navigate to /campaign/select-ad-format |
| 6 | Select "Banner" format | Card highlighted |
| 7 | Click Continue | Navigate to /campaign/create-ad |
| 8 | Fill ad details (name, text, image) | All fields populated |
| 9 | Click Continue | Navigate to /campaign/targeting |
| 10 | Set location, age, gender, interests | Targeting configured |
| 11 | Click Continue | Navigate to /campaign/review |
| 12 | Verify all details | All selections displayed correctly |
| 13 | Click Publish | Navigate to /campaign/payment |
| 14 | Complete payment | Campaign created, redirect to dashboard |
| 15 | Verify campaign in list | New campaign appears with "Active" status |

---

#### TC-CAMP-002: Edit Existing Campaign

| Field | Value |
|-------|-------|
| **ID** | TC-CAMP-002 |
| **Title** | Edit campaign details |
| **Priority** | P1 - High |
| **Preconditions** | Campaign exists with status "Draft" or "Paused" |

**Steps:**
| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Click campaign row in dashboard | Navigate to campaign details |
| 2 | Click "Edit" button | Navigate to edit form |
| 3 | Modify campaign name | Field updated |
| 4 | Modify budget amount | Field updated |
| 5 | Click "Save Changes" | Success message shown |
| 6 | Verify changes persisted | Database updated |

---

#### TC-CAMP-003: Pause/Resume Campaign

| Field | Value |
|-------|-------|
| **ID** | TC-CAMP-003 |
| **Title** | Toggle campaign status |
| **Priority** | P1 - High |
| **Preconditions** | Active campaign exists |

**Steps:**
| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Find active campaign in list | Status shows "Active" |
| 2 | Click pause toggle/button | Confirmation dialog appears |
| 3 | Confirm pause | Status changes to "Paused" |
| 4 | Click resume toggle/button | Status changes back to "Active" |

---

#### TC-CAMP-004: Duplicate Campaign

| Field | Value |
|-------|-------|
| **ID** | TC-CAMP-004 |
| **Title** | Duplicate existing campaign |
| **Priority** | P2 - Medium |
| **Preconditions** | Campaign exists |

**Steps:**
| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Click campaign actions menu | Menu opens |
| 2 | Click "Duplicate" | Confirmation dialog |
| 3 | Confirm | New campaign created |
| 4 | Verify new campaign | Name has "(Copy)" suffix |
| 5 | Verify data copied | All targeting/settings duplicated |

---

#### TC-CAMP-005: Delete Campaign

| Field | Value |
|-------|-------|
| **ID** | TC-CAMP-005 |
| **Title** | Soft delete campaign |
| **Priority** | P1 - High |
| **Preconditions** | Campaign exists |

**Steps:**
| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Click campaign actions menu | Menu opens |
| 2 | Click "Delete" | Confirmation dialog with warning |
| 3 | Confirm delete | Campaign removed from list |
| 4 | Verify soft delete | Database: deletedAt is set |

---

### 4.3 Payment Module

#### TC-PAY-001: Add Payment Method

| Field | Value |
|-------|-------|
| **ID** | TC-PAY-001 |
| **Title** | Add new credit card |
| **Priority** | P0 - Critical |
| **Preconditions** | User logged in, on settings/billing |

**Steps:**
| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Click "Add Payment Method" | Modal opens |
| 2 | Enter card number: 4242424242424242 | Field formatted: 4242 4242 4242 4242 |
| 3 | Enter expiry: 12/28 | Field formatted correctly |
| 4 | Enter CVV: 123 | Field accepts 3 digits |
| 5 | Enter cardholder name | Name populated |
| 6 | Click "Add Card" | Stripe integration processes |
| 7 | Verify success | Card appears in list as "Visa ****4242" |

---

#### TC-PAY-002: Payment Processing - Success

| Field | Value |
|-------|-------|
| **ID** | TC-PAY-002 |
| **Title** | Successful campaign payment |
| **Priority** | P0 - Critical |
| **Preconditions** | Campaign created, valid payment method saved |

**Steps:**
| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Reach payment step in campaign flow | Payment page shown |
| 2 | Select saved payment method | Method highlighted |
| 3 | Verify amount displayed | Budget amount correct |
| 4 | Click "Pay Now" | Loading state shown |
| 5 | Wait for Stripe processing | Success response |
| 6 | Verify redirect | Navigate to success page |
| 7 | Verify campaign activated | Status = "Active" |

---

#### TC-PAY-003: Payment Processing - Declined

| Field | Value |
|-------|-------|
| **ID** | TC-PAY-003 |
| **Title** | Handle declined card |
| **Priority** | P0 - Critical |
| **Preconditions** | Use Stripe test card 4000000000000002 (always declines) |

**Steps:**
| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Attempt payment with declined card | Loading state |
| 2 | Stripe returns decline | Error message: "Card declined" |
| 3 | Verify campaign status | Remains "Draft" or "Pending Payment" |
| 4 | Option to retry or use different card | Buttons present |

---

### 4.4 Dashboard Module

#### TC-DASH-001: View Campaign Statistics

| Field | Value |
|-------|-------|
| **ID** | TC-DASH-001 |
| **Title** | Dashboard displays correct stats |
| **Priority** | P1 - High |
| **Preconditions** | User has campaigns with activity |

**Steps:**
| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Navigate to /dashboard | Dashboard loads |
| 2 | Check stat cards | Total campaigns count correct |
| 3 | Verify budget metrics | Total budget matches sum |
| 4 | Verify impressions | Impressions aggregated correctly |
| 5 | Verify clicks | Click count accurate |

---

#### TC-DASH-002: Filter Campaigns

| Field | Value |
|-------|-------|
| **ID** | TC-DASH-002 |
| **Title** | Filter campaigns by status |
| **Priority** | P2 - Medium |
| **Preconditions** | Multiple campaigns with different statuses |

**Steps:**
| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Click status filter dropdown | Options displayed |
| 2 | Select "Active" | Only active campaigns shown |
| 3 | Select "Paused" | Only paused campaigns shown |
| 4 | Select "All" | All campaigns shown |

---

#### TC-DASH-003: Search Campaigns

| Field | Value |
|-------|-------|
| **ID** | TC-DASH-003 |
| **Title** | Search campaigns by name |
| **Priority** | P2 - Medium |
| **Preconditions** | Multiple campaigns exist |

**Steps:**
| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Enter search term in search box | Debounced input |
| 2 | Wait 300ms | List filters |
| 3 | Verify results | Only matching campaigns shown |
| 4 | Clear search | All campaigns restored |

---

### 4.5 Settings Module

#### TC-SET-001: Update Profile

| Field | Value |
|-------|-------|
| **ID** | TC-SET-001 |
| **Title** | Update user profile information |
| **Priority** | P2 - Medium |
| **Preconditions** | User logged in |

**Steps:**
| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Navigate to /settings | Settings page loads |
| 2 | Click "Edit Profile" | Modal opens |
| 3 | Update first name | Field changed |
| 4 | Update company name | Field changed |
| 5 | Click "Save" | Success message |
| 6 | Verify persistence | Changes saved to database |

---

#### TC-SET-002: Change Password

| Field | Value |
|-------|-------|
| **ID** | TC-SET-002 |
| **Title** | Change account password |
| **Priority** | P1 - High |
| **Preconditions** | User logged in |

**Steps:**
| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Click "Change Password" | Modal opens |
| 2 | Enter current password | Field populated |
| 3 | Enter new password | Field populated |
| 4 | Confirm new password | Fields match |
| 5 | Click "Update Password" | Success message |
| 6 | Logout and login with new password | Login successful |

---

## 5. Automated Test Specifications

### 5.1 Frontend Unit Tests

#### 5.1.1 Button Component Tests

```typescript
// src/components/ui/__tests__/Button.test.tsx

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('button', 'primary', 'md');
    });

    it('renders with secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole('button')).toHaveClass('secondary');
    });

    it('renders with outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      expect(screen.getByRole('button')).toHaveClass('outline');
    });

    it('renders with ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      expect(screen.getByRole('button')).toHaveClass('ghost');
    });

    it('renders with small size', () => {
      render(<Button size="sm">Small</Button>);
      expect(screen.getByRole('button')).toHaveClass('sm');
    });

    it('renders with large size', () => {
      render(<Button size="lg">Large</Button>);
      expect(screen.getByRole('button')).toHaveClass('lg');
    });

    it('renders full width when fullWidth prop is true', () => {
      render(<Button fullWidth>Full Width</Button>);
      expect(screen.getByRole('button')).toHaveClass('fullWidth');
    });

    it('renders left icon when provided', () => {
      render(<Button leftIcon={<span data-testid="left-icon">←</span>}>With Icon</Button>);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('renders right icon when provided', () => {
      render(<Button rightIcon={<span data-testid="right-icon">→</span>}>With Icon</Button>);
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(<Button disabled onClick={handleClick}>Click me</Button>);
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('has disabled attribute when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('has disabled class when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toHaveClass('disabled');
    });
  });

  describe('Accessibility', () => {
    it('has correct role', () => {
      render(<Button>Accessible</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('can have custom aria-label', () => {
      render(<Button aria-label="Custom label">Button</Button>);
      expect(screen.getByLabelText('Custom label')).toBeInTheDocument();
    });

    it('supports type attribute', () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });
  });
});
```

#### 5.1.2 Input Component Tests

```typescript
// src/components/ui/__tests__/Input.test.tsx

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

describe('Input Component', () => {
  describe('Rendering', () => {
    it('renders without label', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<Input label="Email" />);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('renders required indicator when required', () => {
      render(<Input label="Email" required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('renders error message when error prop provided', () => {
      render(<Input label="Email" error="Invalid email" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid email');
    });

    it('renders helper text when provided', () => {
      render(<Input label="Email" helperText="Enter your email address" />);
      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    });

    it('does not render helper text when error is present', () => {
      render(<Input label="Email" helperText="Helper" error="Error" />);
      expect(screen.queryByText('Helper')).not.toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('renders left icon when provided', () => {
      render(<Input leftIcon={<span data-testid="left-icon">📧</span>} />);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('renders right icon when provided', () => {
      render(<Input rightIcon={<span data-testid="right-icon">👁</span>} />);
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('handles onChange events', async () => {
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'test');
      expect(handleChange).toHaveBeenCalled();
    });

    it('updates value when typed', async () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'hello');
      expect(input).toHaveValue('hello');
    });

    it('can be focused', () => {
      render(<Input label="Test" />);
      const input = screen.getByLabelText('Test');
      input.focus();
      expect(input).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('has correct aria-invalid when error', () => {
      render(<Input error="Error" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('has aria-describedby pointing to error', () => {
      render(<Input id="email" error="Error" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'email-error');
    });

    it('has aria-describedby pointing to helper text', () => {
      render(<Input id="email" helperText="Helper" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'email-helper');
    });

    it('label and input are properly associated', () => {
      render(<Input label="Email" />);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });
  });

  describe('Input Types', () => {
    it('supports password type', () => {
      render(<Input type="password" />);
      expect(screen.getByRole('textbox', { hidden: true }) ||
             document.querySelector('input[type="password"]')).toBeInTheDocument();
    });

    it('supports email type', () => {
      render(<Input type="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    });

    it('supports number type', () => {
      render(<Input type="number" />);
      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });
  });
});
```

#### 5.1.3 Validation Utilities Tests

```typescript
// src/utils/__tests__/validation.test.ts

import { describe, it, expect } from 'vitest';
import {
  required,
  minLength,
  maxLength,
  email,
  phone,
  password,
  passwordStrength,
  matchField,
  numeric,
  positiveNumber,
  creditCard,
  cvv,
  expiryDate,
  zipCode,
  url,
  validate,
  validateForm,
  formatCreditCard,
  formatExpiryDate,
  formatPhone,
} from '../validation';

describe('Validation Rules', () => {
  describe('required', () => {
    const rule = required('Field');

    it('returns true for non-empty string', () => {
      expect(rule.validate('hello')).toBe(true);
    });

    it('returns false for empty string', () => {
      expect(rule.validate('')).toBe(false);
    });

    it('returns false for whitespace only', () => {
      expect(rule.validate('   ')).toBe(false);
    });

    it('has correct error message', () => {
      expect(rule.message).toBe('Field is required');
    });
  });

  describe('minLength', () => {
    const rule = minLength(5, 'Password');

    it('returns true when length meets minimum', () => {
      expect(rule.validate('hello')).toBe(true);
    });

    it('returns true when length exceeds minimum', () => {
      expect(rule.validate('hello world')).toBe(true);
    });

    it('returns false when length below minimum', () => {
      expect(rule.validate('hi')).toBe(false);
    });

    it('has correct error message', () => {
      expect(rule.message).toBe('Password must be at least 5 characters');
    });
  });

  describe('maxLength', () => {
    const rule = maxLength(10, 'Username');

    it('returns true when length within limit', () => {
      expect(rule.validate('hello')).toBe(true);
    });

    it('returns true when length equals limit', () => {
      expect(rule.validate('helloworld')).toBe(true);
    });

    it('returns false when length exceeds limit', () => {
      expect(rule.validate('hello world!')).toBe(false);
    });
  });

  describe('email', () => {
    it('validates correct email formats', () => {
      expect(email.validate('test@example.com')).toBe(true);
      expect(email.validate('user.name@domain.co.uk')).toBe(true);
      expect(email.validate('user+tag@example.org')).toBe(true);
    });

    it('rejects invalid email formats', () => {
      expect(email.validate('notanemail')).toBe(false);
      expect(email.validate('missing@domain')).toBe(false);
      expect(email.validate('@nodomain.com')).toBe(false);
      expect(email.validate('spaces in@email.com')).toBe(false);
    });
  });

  describe('phone', () => {
    it('validates correct phone formats', () => {
      expect(phone.validate('1234567890')).toBe(true);
      expect(phone.validate('(123) 456-7890')).toBe(true);
      expect(phone.validate('+1 234 567 8901')).toBe(true);
    });

    it('allows empty for optional fields', () => {
      expect(phone.validate('')).toBe(true);
    });

    it('rejects too short numbers', () => {
      expect(phone.validate('123456')).toBe(false);
    });

    it('rejects letters in phone', () => {
      expect(phone.validate('123-ABC-7890')).toBe(false);
    });
  });

  describe('password', () => {
    it('accepts passwords with 8+ characters', () => {
      expect(password.validate('password')).toBe(true);
      expect(password.validate('verylongpassword123')).toBe(true);
    });

    it('rejects passwords under 8 characters', () => {
      expect(password.validate('pass')).toBe(false);
      expect(password.validate('1234567')).toBe(false);
    });
  });

  describe('passwordStrength', () => {
    it('accepts strong passwords', () => {
      expect(passwordStrength.validate('Password1')).toBe(true);
      expect(passwordStrength.validate('MyP@ssw0rd!')).toBe(true);
    });

    it('rejects passwords without uppercase', () => {
      expect(passwordStrength.validate('password1')).toBe(false);
    });

    it('rejects passwords without lowercase', () => {
      expect(passwordStrength.validate('PASSWORD1')).toBe(false);
    });

    it('rejects passwords without numbers', () => {
      expect(passwordStrength.validate('Password')).toBe(false);
    });

    it('rejects short passwords', () => {
      expect(passwordStrength.validate('Pass1')).toBe(false);
    });
  });

  describe('matchField', () => {
    it('returns true when values match', () => {
      const rule = matchField('password123', 'Passwords');
      expect(rule.validate('password123')).toBe(true);
    });

    it('returns false when values differ', () => {
      const rule = matchField('password123', 'Passwords');
      expect(rule.validate('different')).toBe(false);
    });
  });

  describe('numeric', () => {
    it('accepts numeric strings', () => {
      expect(numeric.validate('12345')).toBe(true);
      expect(numeric.validate('0')).toBe(true);
    });

    it('rejects non-numeric strings', () => {
      expect(numeric.validate('12.34')).toBe(false);
      expect(numeric.validate('abc')).toBe(false);
      expect(numeric.validate('12abc')).toBe(false);
    });
  });

  describe('positiveNumber', () => {
    it('accepts positive numbers', () => {
      expect(positiveNumber.validate('1')).toBe(true);
      expect(positiveNumber.validate('100.50')).toBe(true);
    });

    it('rejects zero and negative', () => {
      expect(positiveNumber.validate('0')).toBe(false);
      expect(positiveNumber.validate('-5')).toBe(false);
    });

    it('rejects non-numeric', () => {
      expect(positiveNumber.validate('abc')).toBe(false);
    });
  });

  describe('creditCard', () => {
    it('accepts valid card lengths', () => {
      expect(creditCard.validate('4242424242424242')).toBe(true);
      expect(creditCard.validate('4242 4242 4242 4242')).toBe(true);
    });

    it('rejects invalid lengths', () => {
      expect(creditCard.validate('424242424242')).toBe(false);
      expect(creditCard.validate('42424242424242424242424242')).toBe(false);
    });
  });

  describe('cvv', () => {
    it('accepts 3-digit CVV', () => {
      expect(cvv.validate('123')).toBe(true);
    });

    it('accepts 4-digit CVV (Amex)', () => {
      expect(cvv.validate('1234')).toBe(true);
    });

    it('rejects invalid CVV lengths', () => {
      expect(cvv.validate('12')).toBe(false);
      expect(cvv.validate('12345')).toBe(false);
    });
  });

  describe('expiryDate', () => {
    it('accepts valid future dates', () => {
      expect(expiryDate.validate('12/30')).toBe(true);
    });

    it('rejects invalid month', () => {
      expect(expiryDate.validate('13/30')).toBe(false);
      expect(expiryDate.validate('00/30')).toBe(false);
    });

    it('rejects invalid format', () => {
      expect(expiryDate.validate('1230')).toBe(false);
      expect(expiryDate.validate('12-30')).toBe(false);
    });
  });

  describe('zipCode', () => {
    it('accepts valid 5-digit zip', () => {
      expect(zipCode.validate('12345')).toBe(true);
    });

    it('accepts valid 9-digit zip', () => {
      expect(zipCode.validate('12345-6789')).toBe(true);
    });

    it('rejects invalid formats', () => {
      expect(zipCode.validate('1234')).toBe(false);
      expect(zipCode.validate('123456')).toBe(false);
    });
  });

  describe('url', () => {
    it('accepts valid URLs', () => {
      expect(url.validate('https://example.com')).toBe(true);
      expect(url.validate('http://localhost:3000')).toBe(true);
    });

    it('allows empty for optional', () => {
      expect(url.validate('')).toBe(true);
    });

    it('rejects invalid URLs', () => {
      expect(url.validate('not-a-url')).toBe(false);
    });
  });
});

describe('validate function', () => {
  it('returns valid for passing all rules', () => {
    const result = validate('hello@example.com', [required('Email'), email]);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('returns first error for failing rules', () => {
    const result = validate('', [required('Email'), email]);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Email is required');
  });
});

describe('validateForm function', () => {
  it('validates entire form', () => {
    const values = {
      email: 'test@example.com',
      password: 'Password1',
    };
    const schema = {
      email: [required('Email'), email],
      password: [required('Password'), passwordStrength],
    };
    const result = validateForm(values, schema);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('returns all errors', () => {
    const values = {
      email: '',
      password: 'weak',
    };
    const schema = {
      email: [required('Email')],
      password: [minLength(8, 'Password')],
    };
    const result = validateForm(values, schema);
    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBeDefined();
    expect(result.errors.password).toBeDefined();
  });
});

describe('Format Helpers', () => {
  describe('formatCreditCard', () => {
    it('formats card number with spaces', () => {
      expect(formatCreditCard('4242424242424242')).toBe('4242 4242 4242 4242');
    });

    it('removes non-digits', () => {
      expect(formatCreditCard('4242-4242-4242-4242')).toBe('4242 4242 4242 4242');
    });

    it('limits to max length', () => {
      expect(formatCreditCard('42424242424242424242')).toBe('4242 4242 4242 4242');
    });
  });

  describe('formatExpiryDate', () => {
    it('formats expiry with slash', () => {
      expect(formatExpiryDate('1228')).toBe('12/28');
    });

    it('handles partial input', () => {
      expect(formatExpiryDate('12')).toBe('12/');
      expect(formatExpiryDate('1')).toBe('1');
    });
  });

  describe('formatPhone', () => {
    it('formats US phone number', () => {
      expect(formatPhone('1234567890')).toBe('(123) 456-7890');
    });

    it('handles partial input', () => {
      expect(formatPhone('123')).toBe('123');
      expect(formatPhone('1234')).toBe('(123) 4');
      expect(formatPhone('1234567')).toBe('(123) 456-7');
    });
  });
});
```

### 5.2 Backend Unit Tests

#### 5.2.1 Auth Service Tests

```typescript
// API_Node/src/services/__tests__/auth.service.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from '../auth.service';
import { userRepository } from '../../repositories/user.repository';
import { notificationRepository } from '../../repositories/notification.repository';
import * as jwt from '../../utils/jwt';
import * as password from '../../utils/password';

// Mock dependencies
vi.mock('../../repositories/user.repository');
vi.mock('../../repositories/notification.repository');
vi.mock('../../utils/jwt');
vi.mock('../../utils/password');

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    vi.clearAllMocks();
  });

  describe('register', () => {
    const validInput = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password1!',
      phone: '1234567890',
      company: 'Test Corp',
    };

    it('creates user when email is not taken', async () => {
      const mockUser = { id: 1, ...validInput, password: 'hashed' };

      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(userRepository.create).mockResolvedValue(mockUser as any);
      vi.mocked(notificationRepository.createDefault).mockResolvedValue(undefined as any);

      const result = await authService.register(validInput);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(validInput.email);
      expect(userRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        email: validInput.email,
        name: validInput.name,
      }));
      expect(notificationRepository.createDefault).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });

    it('throws error when email already exists', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue({ id: 1 } as any);

      await expect(authService.register(validInput))
        .rejects
        .toThrow('A user with this email already exists');

      expect(userRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginInput = {
      email: 'john@example.com',
      password: 'Password1!',
    };

    const mockUser = {
      id: 1,
      email: 'john@example.com',
      password: 'hashedPassword',
      emailVerifiedAt: new Date(),
    };

    it('returns user and token for valid credentials', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser as any);
      vi.mocked(password.comparePassword).mockResolvedValue(true);
      vi.mocked(jwt.generateToken).mockReturnValue('mock-jwt-token');

      const result = await authService.login(loginInput);

      expect(result.user).toEqual(mockUser);
      expect(result.token).toBe('mock-jwt-token');
      expect(jwt.generateToken).toHaveBeenCalledWith({
        userId: 1,
        email: mockUser.email,
      });
    });

    it('throws error for non-existent user', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

      await expect(authService.login(loginInput))
        .rejects
        .toThrow('Invalid email or password');
    });

    it('throws error for wrong password', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser as any);
      vi.mocked(password.comparePassword).mockResolvedValue(false);

      await expect(authService.login(loginInput))
        .rejects
        .toThrow('Invalid email or password');
    });

    it('throws error for unverified email', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue({
        ...mockUser,
        emailVerifiedAt: null,
      } as any);
      vi.mocked(password.comparePassword).mockResolvedValue(true);

      await expect(authService.login(loginInput))
        .rejects
        .toThrow('Please verify your email address first');
    });
  });

  describe('verifyEmail', () => {
    it('verifies email with valid code', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      const verifiedUser = { ...mockUser, emailVerifiedAt: new Date() };

      vi.mocked(userRepository.findByVerificationCode).mockResolvedValue(mockUser as any);
      vi.mocked(userRepository.verifyEmail).mockResolvedValue(verifiedUser as any);

      const result = await authService.verifyEmail('123456');

      expect(userRepository.findByVerificationCode).toHaveBeenCalledWith('123456');
      expect(userRepository.verifyEmail).toHaveBeenCalledWith(1);
      expect(result).toEqual(verifiedUser);
    });

    it('throws error for invalid code', async () => {
      vi.mocked(userRepository.findByVerificationCode).mockResolvedValue(null);

      await expect(authService.verifyEmail('invalid'))
        .rejects
        .toThrow('Invalid or expired verification code');
    });
  });

  describe('forgotPassword', () => {
    it('sends reset email for existing user', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };

      vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser as any);
      vi.mocked(password.generateResetToken).mockReturnValue('reset-token');
      vi.mocked(userRepository.setPasswordResetToken).mockResolvedValue(undefined as any);

      await authService.forgotPassword('test@example.com');

      expect(userRepository.setPasswordResetToken).toHaveBeenCalledWith(1, 'reset-token');
    });

    it('silently succeeds for non-existent email (security)', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

      await expect(authService.forgotPassword('unknown@example.com'))
        .resolves
        .toBeUndefined();

      expect(userRepository.setPasswordResetToken).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('resets password with valid token', async () => {
      const mockUser = { id: 1 };

      vi.mocked(userRepository.findByPasswordResetToken).mockResolvedValue(mockUser as any);
      vi.mocked(userRepository.updatePassword).mockResolvedValue(undefined as any);

      await authService.resetPassword('valid-token', 'NewPassword1!');

      expect(userRepository.updatePassword).toHaveBeenCalledWith(1, 'NewPassword1!');
    });

    it('throws error for invalid token', async () => {
      vi.mocked(userRepository.findByPasswordResetToken).mockResolvedValue(null);

      await expect(authService.resetPassword('invalid', 'password'))
        .rejects
        .toThrow('Invalid or expired password reset token');
    });
  });
});
```

#### 5.2.2 Campaign Service Tests

```typescript
// API_Node/src/services/__tests__/campaign.service.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CampaignService } from '../campaign.service';
import { campaignRepository } from '../../repositories/campaign.repository';

vi.mock('../../repositories/campaign.repository');

describe('CampaignService', () => {
  let campaignService: CampaignService;
  const userId = 1;

  beforeEach(() => {
    campaignService = new CampaignService();
    vi.clearAllMocks();
  });

  describe('getCampaigns', () => {
    it('returns paginated campaigns for user', async () => {
      const mockCampaigns = [
        { id: 1, name: 'Campaign 1', userId },
        { id: 2, name: 'Campaign 2', userId },
      ];

      vi.mocked(campaignRepository.findAllForUser).mockResolvedValue({
        campaigns: mockCampaigns as any,
        total: 2,
      });

      const result = await campaignService.getCampaigns(userId, {
        page: 1,
        perPage: 10,
      });

      expect(result.campaigns).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(campaignRepository.findAllForUser).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ page: 1, perPage: 10 })
      );
    });

    it('applies filters correctly', async () => {
      vi.mocked(campaignRepository.findAllForUser).mockResolvedValue({
        campaigns: [],
        total: 0,
      });

      await campaignService.getCampaigns(userId, {
        page: 1,
        perPage: 10,
        status: 'active',
        adFormat: 'Banner',
        search: 'test',
      });

      expect(campaignRepository.findAllForUser).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          status: 'active',
          adFormat: 'Banner',
          search: 'test',
        })
      );
    });
  });

  describe('getCampaign', () => {
    it('returns campaign for valid id and user', async () => {
      const mockCampaign = { id: 1, name: 'Test', userId };

      vi.mocked(campaignRepository.findByIdForUser).mockResolvedValue(mockCampaign as any);

      const result = await campaignService.getCampaign(1, userId);

      expect(result).toEqual(mockCampaign);
    });

    it('returns null for non-existent campaign', async () => {
      vi.mocked(campaignRepository.findByIdForUser).mockResolvedValue(null);

      const result = await campaignService.getCampaign(999, userId);

      expect(result).toBeNull();
    });
  });

  describe('createCampaign', () => {
    const createInput = {
      name: 'New Campaign',
      adType: 'brand',
      boostType: 'premium',
      adFormat: 'Banner',
      adText: 'Ad text',
      bannerImage: 'image.jpg',
      destinationUrl: 'https://example.com',
      startDate: '2026-02-01',
      endDate: '2026-02-28',
      budget: 1000,
    };

    it('creates campaign without targeting', async () => {
      const mockCampaign = { id: 1, ...createInput, userId };

      vi.mocked(campaignRepository.create).mockResolvedValue(mockCampaign as any);
      vi.mocked(campaignRepository.findById).mockResolvedValue(mockCampaign as any);

      const result = await campaignService.createCampaign(userId, createInput);

      expect(campaignRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          name: createInput.name,
        })
      );
      expect(result).toEqual(mockCampaign);
    });

    it('creates campaign with targeting', async () => {
      const inputWithTargeting = {
        ...createInput,
        targeting: {
          locationName: 'New York',
          latitude: 40.7128,
          longitude: -74.0060,
          radiusKm: 10,
          ageMin: 18,
          ageMax: 35,
          gender: 'all',
          interests: ['tech', 'sports'],
        },
      };
      const mockCampaign = { id: 1, ...inputWithTargeting, userId };

      vi.mocked(campaignRepository.create).mockResolvedValue(mockCampaign as any);
      vi.mocked(campaignRepository.createTargeting).mockResolvedValue({} as any);
      vi.mocked(campaignRepository.findById).mockResolvedValue(mockCampaign as any);

      await campaignService.createCampaign(userId, inputWithTargeting as any);

      expect(campaignRepository.createTargeting).toHaveBeenCalledWith(
        expect.objectContaining({
          campaignId: 1,
          locationName: 'New York',
        })
      );
    });
  });

  describe('updateCampaign', () => {
    it('updates existing campaign', async () => {
      const existing = { id: 1, name: 'Old Name', userId };
      const updated = { id: 1, name: 'New Name', userId };

      vi.mocked(campaignRepository.findByIdForUser).mockResolvedValue(existing as any);
      vi.mocked(campaignRepository.update).mockResolvedValue(updated as any);
      vi.mocked(campaignRepository.findById).mockResolvedValue(updated as any);

      const result = await campaignService.updateCampaign(1, userId, { name: 'New Name' });

      expect(result.name).toBe('New Name');
    });

    it('throws error for non-existent campaign', async () => {
      vi.mocked(campaignRepository.findByIdForUser).mockResolvedValue(null);

      await expect(campaignService.updateCampaign(999, userId, { name: 'Test' }))
        .rejects
        .toThrow('Campaign not found');
    });
  });

  describe('deleteCampaign', () => {
    it('soft deletes campaign', async () => {
      const campaign = { id: 1, userId };

      vi.mocked(campaignRepository.findByIdForUser).mockResolvedValue(campaign as any);
      vi.mocked(campaignRepository.softDelete).mockResolvedValue(undefined as any);

      const result = await campaignService.deleteCampaign(1, userId);

      expect(result).toBe(true);
      expect(campaignRepository.softDelete).toHaveBeenCalledWith(1);
    });

    it('returns false for non-existent campaign', async () => {
      vi.mocked(campaignRepository.findByIdForUser).mockResolvedValue(null);

      const result = await campaignService.deleteCampaign(999, userId);

      expect(result).toBe(false);
    });
  });

  describe('duplicateCampaign', () => {
    it('duplicates existing campaign', async () => {
      const original = { id: 1, name: 'Original', userId };
      const duplicate = { id: 2, name: 'Original (Copy)', userId };

      vi.mocked(campaignRepository.findByIdForUser).mockResolvedValue(original as any);
      vi.mocked(campaignRepository.duplicate).mockResolvedValue(duplicate as any);

      const result = await campaignService.duplicateCampaign(1, userId);

      expect(result.name).toContain('Copy');
    });

    it('throws error for non-existent campaign', async () => {
      vi.mocked(campaignRepository.findByIdForUser).mockResolvedValue(null);

      await expect(campaignService.duplicateCampaign(999, userId))
        .rejects
        .toThrow('Campaign not found');
    });
  });

  describe('getStatistics', () => {
    it('returns aggregated statistics', async () => {
      const mockStats = {
        totalCampaigns: 10,
        activeCampaigns: 5,
        totalBudget: 10000,
        totalSpent: 5000,
        totalImpressions: 100000,
        totalClicks: 5000,
      };

      vi.mocked(campaignRepository.getStatistics).mockResolvedValue(mockStats);

      const result = await campaignService.getStatistics(userId);

      expect(result).toEqual(mockStats);
    });
  });

  describe('exportCampaigns', () => {
    it('generates CSV export', async () => {
      const campaigns = [
        {
          id: 1,
          name: 'Test',
          adType: 'brand',
          boostType: 'premium',
          adFormat: 'Banner',
          status: 'active',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-01-31'),
          budget: 1000,
          spent: 500,
          impressions: 10000,
          clicks: 500,
        },
      ];

      vi.mocked(campaignRepository.getForExport).mockResolvedValue(campaigns as any);

      const result = await campaignService.exportCampaigns(userId, {});

      expect(result).toContain('ID,Name,Ad Type');
      expect(result).toContain('Test');
    });
  });
});
```

#### 5.2.3 Payment Service Tests

```typescript
// API_Node/src/services/__tests__/payment.service.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentService } from '../payment.service';
import { paymentMethodRepository } from '../../repositories/payment.repository';

vi.mock('../../repositories/payment.repository');

describe('PaymentService', () => {
  let paymentService: PaymentService;
  const userId = 1;

  beforeEach(() => {
    paymentService = new PaymentService();
    vi.clearAllMocks();
  });

  describe('getPaymentMethods', () => {
    it('returns all payment methods for user', async () => {
      const methods = [
        { id: 1, cardType: 'visa', lastFour: '4242', userId },
        { id: 2, cardType: 'mastercard', lastFour: '5555', userId },
      ];

      vi.mocked(paymentMethodRepository.findAllForUser).mockResolvedValue(methods as any);

      const result = await paymentService.getPaymentMethods(userId);

      expect(result).toHaveLength(2);
      expect(result[0].cardType).toBe('visa');
    });
  });

  describe('addPaymentMethod', () => {
    it('adds Visa card correctly', async () => {
      const input = {
        cardNumber: '4242424242424242',
        expiryMonth: 12,
        expiryYear: 2028,
        cardholderName: 'John Doe',
        stripePaymentMethodId: 'pm_test',
      };
      const created = { id: 1, cardType: 'visa', lastFour: '4242', userId };

      vi.mocked(paymentMethodRepository.create).mockResolvedValue(created as any);

      const result = await paymentService.addPaymentMethod(userId, input);

      expect(paymentMethodRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cardType: 'visa',
          lastFour: '4242',
        })
      );
      expect(result.cardType).toBe('visa');
    });

    it('adds Mastercard correctly', async () => {
      const input = {
        cardNumber: '5555555555554444',
        expiryMonth: 12,
        expiryYear: 2028,
        cardholderName: 'John Doe',
        stripePaymentMethodId: 'pm_test',
      };

      vi.mocked(paymentMethodRepository.create).mockResolvedValue({ cardType: 'mastercard' } as any);

      await paymentService.addPaymentMethod(userId, input);

      expect(paymentMethodRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cardType: 'mastercard',
          lastFour: '4444',
        })
      );
    });

    it('adds Amex correctly', async () => {
      const input = {
        cardNumber: '378282246310005',
        expiryMonth: 12,
        expiryYear: 2028,
        cardholderName: 'John Doe',
        stripePaymentMethodId: 'pm_test',
      };

      vi.mocked(paymentMethodRepository.create).mockResolvedValue({ cardType: 'amex' } as any);

      await paymentService.addPaymentMethod(userId, input);

      expect(paymentMethodRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cardType: 'amex',
        })
      );
    });

    it('handles unknown card type', async () => {
      const input = {
        cardNumber: '9999999999999999',
        expiryMonth: 12,
        expiryYear: 2028,
        cardholderName: 'John Doe',
        stripePaymentMethodId: 'pm_test',
      };

      vi.mocked(paymentMethodRepository.create).mockResolvedValue({ cardType: 'unknown' } as any);

      await paymentService.addPaymentMethod(userId, input);

      expect(paymentMethodRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cardType: 'unknown',
        })
      );
    });
  });

  describe('removePaymentMethod', () => {
    it('removes non-default payment method', async () => {
      const method = { id: 1, userId, isDefault: false };

      vi.mocked(paymentMethodRepository.findByIdForUser).mockResolvedValue(method as any);
      vi.mocked(paymentMethodRepository.delete).mockResolvedValue(undefined as any);

      const result = await paymentService.removePaymentMethod(1, userId);

      expect(result).toBe(true);
      expect(paymentMethodRepository.delete).toHaveBeenCalledWith(1);
    });

    it('sets new default when removing default card', async () => {
      const defaultMethod = { id: 1, userId, isDefault: true };
      const remaining = [{ id: 2, userId, isDefault: false }];

      vi.mocked(paymentMethodRepository.findByIdForUser).mockResolvedValue(defaultMethod as any);
      vi.mocked(paymentMethodRepository.delete).mockResolvedValue(undefined as any);
      vi.mocked(paymentMethodRepository.findAllForUser).mockResolvedValue(remaining as any);
      vi.mocked(paymentMethodRepository.setAsDefault).mockResolvedValue(undefined as any);

      await paymentService.removePaymentMethod(1, userId);

      expect(paymentMethodRepository.setAsDefault).toHaveBeenCalledWith(2, userId);
    });

    it('returns false for non-existent method', async () => {
      vi.mocked(paymentMethodRepository.findByIdForUser).mockResolvedValue(null);

      const result = await paymentService.removePaymentMethod(999, userId);

      expect(result).toBe(false);
    });
  });

  describe('setAsDefault', () => {
    it('sets payment method as default', async () => {
      const method = { id: 1, userId, isDefault: false };

      vi.mocked(paymentMethodRepository.findByIdForUser).mockResolvedValue(method as any);
      vi.mocked(paymentMethodRepository.setAsDefault).mockResolvedValue(undefined as any);

      const result = await paymentService.setAsDefault(1, userId);

      expect(result).toBe(true);
      expect(paymentMethodRepository.setAsDefault).toHaveBeenCalledWith(1, userId);
    });

    it('returns false for non-existent method', async () => {
      vi.mocked(paymentMethodRepository.findByIdForUser).mockResolvedValue(null);

      const result = await paymentService.setAsDefault(999, userId);

      expect(result).toBe(false);
    });
  });
});
```

### 5.3 API Integration Tests

#### 5.3.1 Auth Routes Tests

```typescript
// API_Node/src/routes/__tests__/auth.routes.test.ts

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authRoutes } from '../auth.routes';
import { authService } from '../../services/auth.service';

vi.mock('../../services/auth.service');

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Routes', () => {
  describe('POST /auth/register', () => {
    const validBody = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password1!',
      phone: '1234567890',
      company: 'Test Corp',
    };

    it('returns 201 for successful registration', async () => {
      vi.mocked(authService.register).mockResolvedValue({
        id: 1,
        email: validBody.email,
      } as any);

      const response = await request(app)
        .post('/auth/register')
        .send(validBody);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Registration successful');
    });

    it('returns 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({ email: 'test@test.com' });

      expect(response.status).toBe(400);
    });

    it('returns 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({ ...validBody, email: 'invalid' });

      expect(response.status).toBe(400);
    });

    it('returns 400 for weak password', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({ ...validBody, password: 'weak' });

      expect(response.status).toBe(400);
    });

    it('returns 400 for duplicate email', async () => {
      vi.mocked(authService.register).mockRejectedValue(
        new Error('A user with this email already exists')
      );

      const response = await request(app)
        .post('/auth/register')
        .send(validBody);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /auth/login', () => {
    const validLogin = {
      email: 'john@example.com',
      password: 'Password1!',
    };

    it('returns 200 with token for valid credentials', async () => {
      vi.mocked(authService.login).mockResolvedValue({
        user: { id: 1, email: validLogin.email } as any,
        token: 'jwt-token-here',
      });

      const response = await request(app)
        .post('/auth/login')
        .send(validLogin);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBe('jwt-token-here');
      expect(response.body.data.tokenType).toBe('Bearer');
    });

    it('returns 401 for invalid credentials', async () => {
      vi.mocked(authService.login).mockRejectedValue(
        new Error('Invalid email or password')
      );

      const response = await request(app)
        .post('/auth/login')
        .send(validLogin);

      expect(response.status).toBe(401);
    });

    it('returns 401 for unverified email', async () => {
      vi.mocked(authService.login).mockRejectedValue(
        new Error('Please verify your email address first')
      );

      const response = await request(app)
        .post('/auth/login')
        .send(validLogin);

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('verify your email');
    });
  });

  describe('POST /auth/verify-email', () => {
    it('returns 200 for valid verification code', async () => {
      vi.mocked(authService.verifyEmail).mockResolvedValue({
        id: 1,
        emailVerifiedAt: new Date(),
      } as any);

      const response = await request(app)
        .post('/auth/verify-email')
        .send({ code: '123456' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('verified successfully');
    });

    it('returns 400 for invalid code', async () => {
      vi.mocked(authService.verifyEmail).mockRejectedValue(
        new Error('Invalid or expired verification code')
      );

      const response = await request(app)
        .post('/auth/verify-email')
        .send({ code: 'invalid' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('returns 200 regardless of email existence (security)', async () => {
      vi.mocked(authService.forgotPassword).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'any@email.com' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('If an account exists');
    });
  });

  describe('POST /auth/reset-password', () => {
    it('returns 200 for successful reset', async () => {
      vi.mocked(authService.resetPassword).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/auth/reset-password')
        .send({ token: 'valid-token', password: 'NewPassword1!' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('reset successfully');
    });

    it('returns 400 for invalid token', async () => {
      vi.mocked(authService.resetPassword).mockRejectedValue(
        new Error('Invalid or expired password reset token')
      );

      const response = await request(app)
        .post('/auth/reset-password')
        .send({ token: 'invalid', password: 'NewPassword1!' });

      expect(response.status).toBe(400);
    });
  });
});
```

---

## 6. E2E Test Scenarios

### 6.1 Authentication Flow

```typescript
// e2e/auth.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.describe('Registration', () => {
    test('user can register with valid data', async ({ page }) => {
      await page.goto('/auth/signup');

      // Fill registration form
      await page.fill('input[type="email"]', `test${Date.now()}@example.com`);
      await page.fill('input[placeholder="John"]', 'John');
      await page.fill('input[placeholder="Doe"]', 'Doe');
      await page.fill('input[type="password"]', 'Password1!');
      await page.click('input[type="checkbox"]');

      // Submit
      await page.click('button[type="submit"]');

      // Verify redirect to verification page
      await expect(page).toHaveURL('/auth/verify-email');
    });

    test('shows validation errors for invalid email', async ({ page }) => {
      await page.goto('/auth/signup');

      await page.fill('input[type="email"]', 'invalid-email');
      await page.fill('input[placeholder="John"]', 'John');
      await page.click('body'); // Trigger blur

      // Check for error message
      await expect(page.locator('text=valid email')).toBeVisible();
    });

    test('shows validation for weak password', async ({ page }) => {
      await page.goto('/auth/signup');

      await page.fill('input[type="password"]', 'weak');
      await page.click('body');

      await expect(page.locator('text=at least 8 characters')).toBeVisible();
    });

    test('requires terms agreement', async ({ page }) => {
      await page.goto('/auth/signup');

      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[placeholder="John"]', 'John');
      await page.fill('input[placeholder="Doe"]', 'Doe');
      await page.fill('input[type="password"]', 'Password1!');

      // Don't check terms
      await page.click('button[type="submit"]');

      // Form should not submit
      await expect(page).toHaveURL('/auth/signup');
    });
  });

  test.describe('Login', () => {
    test('user can login with valid credentials', async ({ page }) => {
      await page.goto('/auth/signin');

      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'Password1!');

      await page.click('button[type="submit"]');

      await expect(page).toHaveURL('/dashboard');
    });

    test('shows error for invalid credentials', async ({ page }) => {
      await page.goto('/auth/signin');

      await page.fill('input[type="email"]', 'wrong@example.com');
      await page.fill('input[type="password"]', 'WrongPassword1!');

      await page.click('button[type="submit"]');

      await expect(page.locator('text=Invalid email or password')).toBeVisible();
    });

    test('social login buttons are present', async ({ page }) => {
      await page.goto('/auth/signin');

      await expect(page.locator('text=Sign in with Facebook')).toBeVisible();
      await expect(page.locator('text=Sign in with Google')).toBeVisible();
    });

    test('forgot password link works', async ({ page }) => {
      await page.goto('/auth/signin');

      await page.click('text=Forgot password?');

      await expect(page).toHaveURL('/auth/forgot-password');
    });
  });

  test.describe('Password Reset', () => {
    test('user can request password reset', async ({ page }) => {
      await page.goto('/auth/forgot-password');

      await page.fill('input[type="email"]', 'test@example.com');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=reset link has been sent')).toBeVisible();
    });
  });
});
```

### 6.2 Campaign Creation Flow

```typescript
// e2e/campaign.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Campaign Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/auth/signin');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Password1!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('complete campaign creation wizard', async ({ page }) => {
    // Start creation
    await page.click('text=Create New Ad');
    await expect(page).toHaveURL('/campaign/select-ad-type');

    // Step 1: Select Ad Type
    await page.click('[data-testid="ad-type-brand"]');
    await page.click('button:has-text("Continue")');
    await expect(page).toHaveURL('/campaign/select-boost-type');

    // Step 2: Select Boost Type
    await page.click('[data-testid="boost-type-premium"]');
    await page.click('button:has-text("Continue")');
    await expect(page).toHaveURL('/campaign/select-ad-format');

    // Step 3: Select Ad Format
    await page.click('[data-testid="ad-format-banner"]');
    await page.click('button:has-text("Continue")');
    await expect(page).toHaveURL('/campaign/create-ad');

    // Step 4: Create Ad
    await page.fill('input[name="name"]', 'E2E Test Campaign');
    await page.fill('textarea[name="adText"]', 'This is a test ad');
    await page.fill('input[name="destinationUrl"]', 'https://example.com');
    await page.fill('input[name="startDate"]', '2026-02-01');
    await page.fill('input[name="endDate"]', '2026-02-28');
    await page.fill('input[name="budget"]', '1000');
    await page.click('button:has-text("Continue")');
    await expect(page).toHaveURL('/campaign/targeting');

    // Step 5: Targeting
    await page.fill('input[name="location"]', 'New York');
    await page.fill('input[name="ageMin"]', '18');
    await page.fill('input[name="ageMax"]', '35');
    await page.click('button:has-text("Continue")');
    await expect(page).toHaveURL('/campaign/review');

    // Step 6: Review
    await expect(page.locator('text=E2E Test Campaign')).toBeVisible();
    await expect(page.locator('text=$1,000')).toBeVisible();
  });

  test('can navigate back through wizard', async ({ page }) => {
    await page.goto('/campaign/select-ad-type');

    await page.click('[data-testid="ad-type-brand"]');
    await page.click('button:has-text("Continue")');

    await page.click('button:has-text("Back")');
    await expect(page).toHaveURL('/campaign/select-ad-type');
  });

  test('validates required fields on create ad step', async ({ page }) => {
    await page.goto('/campaign/create-ad');

    await page.click('button:has-text("Continue")');

    await expect(page.locator('text=required')).toBeVisible();
  });
});
```

### 6.3 Dashboard Operations

```typescript
// e2e/dashboard.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Password1!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('displays campaign statistics', async ({ page }) => {
    await expect(page.locator('[data-testid="stat-total-campaigns"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-total-budget"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-impressions"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-clicks"]')).toBeVisible();
  });

  test('displays campaign list', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("Campaign")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Budget")')).toBeVisible();
  });

  test('can filter campaigns by status', async ({ page }) => {
    await page.click('[data-testid="status-filter"]');
    await page.click('text=Active');

    // Verify filter applied
    await expect(page.locator('[data-testid="campaign-row"]')).toHaveCount(0);
  });

  test('can search campaigns by name', async ({ page }) => {
    await page.fill('[data-testid="search-input"]', 'Test');

    // Wait for debounce
    await page.waitForTimeout(500);

    // Verify search applied
    const rows = page.locator('[data-testid="campaign-row"]');
    for (const row of await rows.all()) {
      await expect(row).toContainText('Test');
    }
  });

  test('can toggle campaign status', async ({ page }) => {
    const firstCampaign = page.locator('[data-testid="campaign-row"]').first();
    const toggle = firstCampaign.locator('[data-testid="status-toggle"]');

    await toggle.click();

    // Verify status changed
    await expect(page.locator('text=Status updated')).toBeVisible();
  });

  test('can paginate through campaigns', async ({ page }) => {
    await page.click('[data-testid="next-page"]');

    await expect(page.locator('text=Page 2')).toBeVisible();
  });
});
```

### 6.4 Payment Flow

```typescript
// e2e/payment.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Payment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Password1!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('can add payment method', async ({ page }) => {
    await page.goto('/settings');
    await page.click('text=Billing & Payments');
    await page.click('text=Add Payment Method');

    // Fill card details (Stripe test card)
    await page.fill('input[name="cardNumber"]', '4242424242424242');
    await page.fill('input[name="expiry"]', '12/28');
    await page.fill('input[name="cvv"]', '123');
    await page.fill('input[name="cardholderName"]', 'John Doe');

    await page.click('button:has-text("Add Card")');

    await expect(page.locator('text=Card added successfully')).toBeVisible();
    await expect(page.locator('text=Visa ****4242')).toBeVisible();
  });

  test('can remove payment method', async ({ page }) => {
    await page.goto('/settings');
    await page.click('text=Billing & Payments');

    await page.click('[data-testid="remove-card-1"]');
    await page.click('button:has-text("Confirm")');

    await expect(page.locator('text=Card removed')).toBeVisible();
  });

  test('can set default payment method', async ({ page }) => {
    await page.goto('/settings');
    await page.click('text=Billing & Payments');

    await page.click('[data-testid="set-default-2"]');

    await expect(page.locator('text=Default payment method updated')).toBeVisible();
  });

  test('handles declined card gracefully', async ({ page }) => {
    await page.goto('/settings');
    await page.click('text=Billing & Payments');
    await page.click('text=Add Payment Method');

    // Stripe test card that always declines
    await page.fill('input[name="cardNumber"]', '4000000000000002');
    await page.fill('input[name="expiry"]', '12/28');
    await page.fill('input[name="cvv"]', '123');
    await page.fill('input[name="cardholderName"]', 'John Doe');

    await page.click('button:has-text("Add Card")');

    await expect(page.locator('text=Card declined')).toBeVisible();
  });
});
```

---

## 7. Test Infrastructure Setup

### 7.1 Frontend Test Setup

#### package.json additions

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "@vitest/ui": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/user-event": "^14.5.0",
    "jsdom": "^24.0.0",
    "msw": "^2.2.0",
    "@playwright/test": "^1.42.0"
  }
}
```

#### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
```

#### src/test/setup.ts

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

#### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 7.2 Backend Test Setup

#### API_Node/vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        'prisma/',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
```

#### API_Node/src/test/setup.ts

```typescript
import { vi } from 'vitest';

// Mock Prisma
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    campaign: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    paymentMethod: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback({
      user: { create: vi.fn(), update: vi.fn() },
      campaign: { create: vi.fn(), update: vi.fn() },
      paymentMethod: { create: vi.fn(), update: vi.fn() },
    })),
  })),
}));

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
```

---

## 8. Coverage Requirements

### 8.1 Minimum Coverage by Module

| Module | Lines | Branches | Functions |
|--------|-------|----------|-----------|
| Auth | 90% | 85% | 95% |
| Payment | 90% | 85% | 95% |
| Campaign | 85% | 80% | 90% |
| UI Components | 80% | 75% | 85% |
| Utilities | 95% | 90% | 95% |
| Middleware | 85% | 80% | 90% |
| Validators | 95% | 90% | 95% |

### 8.2 Critical Path Coverage

| Path | Required Coverage | Rationale |
|------|-------------------|-----------|
| Registration | 95% | User acquisition |
| Login | 95% | Core functionality |
| Payment | 95% | Financial operations |
| Campaign CRUD | 90% | Core business |
| Email Verification | 90% | Security |

---

## 9. Testing Schedule

### Phase 1: Foundation (Week 1-2)
- [ ] Set up test infrastructure
- [ ] Configure Vitest, RTL, Playwright
- [ ] Write validation utility tests
- [ ] Write UI component tests

### Phase 2: Auth & Security (Week 3-4)
- [ ] Auth service unit tests
- [ ] Auth controller integration tests
- [ ] Auth E2E tests
- [ ] Password utility tests

### Phase 3: Core Business (Week 5-6)
- [ ] Campaign service tests
- [ ] Campaign API tests
- [ ] Campaign E2E tests
- [ ] Dashboard tests

### Phase 4: Payments (Week 7-8)
- [ ] Payment service tests
- [ ] Stripe integration tests
- [ ] Payment E2E tests

### Phase 5: Polish & Coverage (Week 9-10)
- [ ] Fill coverage gaps
- [ ] Performance tests
- [ ] Accessibility tests
- [ ] Documentation updates

---

## 10. Appendices

### A. Test Data Fixtures

```typescript
// src/test/fixtures/users.ts
export const testUsers = {
  valid: {
    email: 'test@example.com',
    password: 'Password1!',
    name: 'Test User',
  },
  unverified: {
    email: 'unverified@example.com',
    password: 'Password1!',
    emailVerifiedAt: null,
  },
};

// src/test/fixtures/campaigns.ts
export const testCampaigns = {
  active: {
    id: 1,
    name: 'Active Campaign',
    status: 'active',
    budget: 1000,
  },
  draft: {
    id: 2,
    name: 'Draft Campaign',
    status: 'draft',
    budget: 500,
  },
};

// src/test/fixtures/payments.ts
export const testCards = {
  visa: '4242424242424242',
  mastercard: '5555555555554444',
  amex: '378282246310005',
  declined: '4000000000000002',
};
```

### B. Common Test Utilities

```typescript
// src/test/utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ReactElement } from 'react';

const AllProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, { wrapper: AllProviders, ...options });
};

export * from '@testing-library/react';
```

### C. CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

**Document Status:** Complete
**Next Review:** After Phase 1 implementation
**Owner:** QA Team

