import { render, type RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import type { ReactElement, ReactNode } from 'react';

interface WrapperProps {
  children: ReactNode;
}

const AllProviders = ({ children }: WrapperProps) => {
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

// Test data fixtures
export const testUsers = {
  valid: {
    email: 'test@example.com',
    password: 'Password1!',
    firstName: 'John',
    lastName: 'Doe',
  },
  invalid: {
    email: 'invalid-email',
    password: 'weak',
  },
};

export const testCampaigns = {
  active: {
    id: 1,
    name: 'Active Campaign',
    status: 'Active',
    budget: 1000,
    spent: 500,
    impressions: 10000,
    clicks: 500,
    startDate: '2026-01-01',
    endDate: '2026-01-31',
  },
  paused: {
    id: 2,
    name: 'Paused Campaign',
    status: 'Paused',
    budget: 500,
    spent: 250,
    impressions: 5000,
    clicks: 250,
    startDate: '2026-01-01',
    endDate: '2026-01-31',
  },
  draft: {
    id: 3,
    name: 'Draft Campaign',
    status: 'Draft',
    budget: 200,
    spent: 0,
    impressions: 0,
    clicks: 0,
    startDate: '2026-02-01',
    endDate: '2026-02-28',
  },
};

export const testPaymentMethods = {
  visa: {
    id: 1,
    cardType: 'visa',
    lastFour: '4242',
    expiryMonth: 12,
    expiryYear: 2028,
    cardholderName: 'John Doe',
    isDefault: true,
  },
  mastercard: {
    id: 2,
    cardType: 'mastercard',
    lastFour: '5555',
    expiryMonth: 6,
    expiryYear: 2027,
    cardholderName: 'John Doe',
    isDefault: false,
  },
};

export const testCards = {
  visa: '4242424242424242',
  mastercard: '5555555555554444',
  amex: '378282246310005',
  discover: '6011111111111117',
  declined: '4000000000000002',
  insufficientFunds: '4000000000009995',
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
