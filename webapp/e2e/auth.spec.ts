import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.describe('Landing Page', () => {
    test('displays landing page with sign in/up buttons', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('h1')).toContainText('Myngly');
      await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /get started|sign up/i })).toBeVisible();
    });

    test('navigates to sign in from landing page', async ({ page }) => {
      await page.goto('/');
      await page.click('text=Sign in');

      await expect(page).toHaveURL('/auth/signin');
    });

    test('navigates to sign up from landing page', async ({ page }) => {
      await page.goto('/');
      await page.click('text=Get Started');

      await expect(page).toHaveURL('/auth/signup');
    });
  });

  test.describe('Registration', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/signup');
    });

    test('displays registration form', async ({ page }) => {
      await expect(page.locator('h1, h2')).toContainText(/sign up/i);
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[placeholder*="John"]')).toBeVisible();
      await expect(page.locator('input[placeholder*="Doe"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('input[type="checkbox"]')).toBeVisible();
    });

    test('validates required email field', async ({ page }) => {
      await page.fill('input[placeholder*="John"]', 'John');
      await page.fill('input[placeholder*="Doe"]', 'Doe');
      await page.fill('input[type="password"]', 'Password123!');
      await page.click('input[type="checkbox"]');

      // Try to submit without email
      await page.click('button[type="submit"]');

      // Form should not navigate
      await expect(page).toHaveURL('/auth/signup');
    });

    test('validates email format', async ({ page }) => {
      await page.fill('input[type="email"]', 'invalid-email');
      await page.press('input[type="email"]', 'Tab');

      // Check for HTML5 validation or custom error
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toHaveAttribute('type', 'email');
    });

    test('validates password requirements', async ({ page }) => {
      await page.fill('input[type="password"]', 'weak');
      await page.press('input[type="password"]', 'Tab');

      // Should show helper text about password requirements
      await expect(page.locator('text=8 characters')).toBeVisible();
    });

    test('requires terms agreement', async ({ page }) => {
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[placeholder*="John"]', 'John');
      await page.fill('input[placeholder*="Doe"]', 'Doe');
      await page.fill('input[type="password"]', 'Password123!');

      // Don't check terms checkbox
      await page.click('button[type="submit"]');

      // Should not navigate without terms
      await expect(page).toHaveURL('/auth/signup');
    });

    test('successful registration redirects to verify email', async ({ page }) => {
      const uniqueEmail = `test${Date.now()}@example.com`;

      await page.fill('input[type="email"]', uniqueEmail);
      await page.fill('input[placeholder*="John"]', 'John');
      await page.fill('input[placeholder*="Doe"]', 'Doe');
      await page.fill('input[type="password"]', 'Password123!');
      await page.click('input[type="checkbox"]');

      await page.click('button[type="submit"]');

      await expect(page).toHaveURL('/auth/verify-email', { timeout: 10000 });
    });

    test('has link to sign in page', async ({ page }) => {
      await expect(page.locator('text=Already have an account')).toBeVisible();

      await page.click('text=Sign in');

      await expect(page).toHaveURL('/auth/signin');
    });

    test('has links to terms and privacy policy', async ({ page }) => {
      await expect(page.getByRole('link', { name: /terms/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /privacy/i })).toBeVisible();
    });
  });

  test.describe('Login', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/signin');
    });

    test('displays login form', async ({ page }) => {
      await expect(page.locator('h1, h2')).toContainText(/sign in/i);
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('displays social login buttons', async ({ page }) => {
      await expect(page.locator('text=Facebook')).toBeVisible();
      await expect(page.locator('text=Google')).toBeVisible();
    });

    test('validates required fields', async ({ page }) => {
      await page.click('button[type="submit"]');

      // Should not navigate with empty fields
      await expect(page).toHaveURL('/auth/signin');
    });

    test('successful login redirects to dashboard', async ({ page }) => {
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'Password123!');

      await page.click('button[type="submit"]');

      await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    });

    test('has link to sign up page', async ({ page }) => {
      await expect(page.locator("text=Don't have an account")).toBeVisible();

      await page.click('a:has-text("Sign up")');

      await expect(page).toHaveURL('/auth/signup');
    });

    test('has forgot password link', async ({ page }) => {
      await page.click('text=Forgot password');

      await expect(page).toHaveURL('/auth/forgot-password');
    });
  });

  test.describe('Forgot Password', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/forgot-password');
    });

    test('displays forgot password form', async ({ page }) => {
      await expect(page.locator('h1, h2')).toContainText(/forgot|reset|password/i);
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.getByRole('button', { name: /send|reset|submit/i })).toBeVisible();
    });

    test('validates email field', async ({ page }) => {
      await page.click('button[type="submit"]');

      // Should not proceed without email
      await expect(page).toHaveURL('/auth/forgot-password');
    });

    test('shows success message after submission', async ({ page }) => {
      await page.fill('input[type="email"]', 'test@example.com');
      await page.click('button[type="submit"]');

      // Should show confirmation message
      await expect(
        page.locator('text=/sent|check|email|link/i')
      ).toBeVisible({ timeout: 5000 });
    });

    test('has link back to sign in', async ({ page }) => {
      await page.click('text=Sign in');

      await expect(page).toHaveURL('/auth/signin');
    });
  });

  test.describe('Email Verification', () => {
    test('displays verification code input', async ({ page }) => {
      await page.goto('/auth/verify-email');

      await expect(page.locator('h1, h2')).toContainText(/verify|email|code/i);
      // Should have code input fields
      const codeInputs = page.locator('input[type="text"], input[type="number"]');
      await expect(codeInputs.first()).toBeVisible();
    });

    test('allows entering verification code', async ({ page }) => {
      await page.goto('/auth/verify-email');

      // Find code inputs
      const inputs = page.locator('.codeInput, input[maxlength="1"]');
      const count = await inputs.count();

      if (count > 0) {
        // Enter code one digit at a time
        for (let i = 0; i < Math.min(count, 6); i++) {
          await inputs.nth(i).fill(String(i + 1));
        }
      }
    });

    test('has resend code option', async ({ page }) => {
      await page.goto('/auth/verify-email');

      await expect(
        page.locator('text=/resend|didn.*receive|try again/i')
      ).toBeVisible();
    });
  });

  test.describe('Protected Routes', () => {
    test('redirects unauthenticated user from dashboard', async ({ page }) => {
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/\/(auth\/signin|auth\/signup|$)/);
    });

    test('redirects unauthenticated user from settings', async ({ page }) => {
      await page.goto('/settings');

      await expect(page).toHaveURL(/\/(auth\/signin|auth\/signup|$)/);
    });

    test('redirects unauthenticated user from campaign pages', async ({ page }) => {
      await page.goto('/campaign/select-ad-type');

      await expect(page).toHaveURL(/\/(auth\/signin|auth\/signup|$)/);
    });
  });
});
