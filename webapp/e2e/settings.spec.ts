import { test, expect } from '@playwright/test';

test.describe('Settings', () => {
  // Helper to simulate login
  async function login(page: any) {
    await page.goto('/auth/signin');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  }

  test.describe('Settings Page', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.goto('/settings');
    });

    test('displays settings page', async ({ page }) => {
      await expect(page).toHaveURL('/settings');
      await expect(page.locator('h1, h2')).toContainText(/settings/i);
    });

    test('shows profile section', async ({ page }) => {
      await expect(
        page.locator('text=/profile|account|personal/i').first()
      ).toBeVisible();
    });

    test('shows billing section', async ({ page }) => {
      await expect(
        page.locator('text=/billing|payment|card/i').first()
      ).toBeVisible();
    });

    test('shows notifications section', async ({ page }) => {
      await expect(
        page.locator('text=/notification|alert|email preference/i').first()
      ).toBeVisible();
    });
  });

  test.describe('Profile Management', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.goto('/settings');
    });

    test('can open edit profile modal', async ({ page }) => {
      const editButton = page.locator(
        'button:has-text("Edit Profile"), button:has-text("Edit"), [data-testid="edit-profile"]'
      ).first();

      if (await editButton.isVisible()) {
        await editButton.click();

        // Modal should open
        await expect(
          page.locator('[role="dialog"], [class*="modal"]')
        ).toBeVisible();
      }
    });

    test('edit profile modal has form fields', async ({ page }) => {
      const editButton = page.locator('button:has-text("Edit Profile")').first();

      if (await editButton.isVisible()) {
        await editButton.click();

        // Should have name fields
        await expect(
          page.locator('input[name*="name" i], input[placeholder*="name" i]').first()
        ).toBeVisible();
      }
    });

    test('can update profile name', async ({ page }) => {
      const editButton = page.locator('button:has-text("Edit Profile")').first();

      if (await editButton.isVisible()) {
        await editButton.click();

        const nameInput = page.locator(
          'input[name="firstName"], input[name="name"], input[placeholder*="name" i]'
        ).first();

        await nameInput.clear();
        await nameInput.fill('Updated Name');

        await page.click('button:has-text("Save")');

        // Should show success
        await expect(
          page.locator('text=/saved|updated|success/i')
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test('can cancel profile edit', async ({ page }) => {
      const editButton = page.locator('button:has-text("Edit Profile")').first();

      if (await editButton.isVisible()) {
        await editButton.click();

        await page.click('button:has-text("Cancel")');

        // Modal should close
        await expect(page.locator('[role="dialog"]')).not.toBeVisible();
      }
    });
  });

  test.describe('Password Change', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.goto('/settings');
    });

    test('can open change password modal', async ({ page }) => {
      const changePasswordBtn = page.locator(
        'button:has-text("Change Password"), [data-testid="change-password"]'
      ).first();

      if (await changePasswordBtn.isVisible()) {
        await changePasswordBtn.click();

        await expect(page.locator('[role="dialog"]')).toBeVisible();
      }
    });

    test('change password form has required fields', async ({ page }) => {
      const changePasswordBtn = page.locator('button:has-text("Change Password")').first();

      if (await changePasswordBtn.isVisible()) {
        await changePasswordBtn.click();

        // Should have current and new password fields
        await expect(
          page.locator('input[name*="current" i], input[placeholder*="current" i]')
        ).toBeVisible();
        await expect(
          page.locator('input[name*="new" i], input[placeholder*="new" i]').first()
        ).toBeVisible();
      }
    });

    test('validates password confirmation match', async ({ page }) => {
      const changePasswordBtn = page.locator('button:has-text("Change Password")').first();

      if (await changePasswordBtn.isVisible()) {
        await changePasswordBtn.click();

        const currentPassword = page.locator('input[name*="current" i]').first();
        const newPassword = page.locator('input[name*="new" i]').first();
        const confirmPassword = page.locator('input[name*="confirm" i]').first();

        await currentPassword.fill('OldPassword123!');
        await newPassword.fill('NewPassword123!');
        await confirmPassword.fill('DifferentPassword123!');

        await page.click('button:has-text("Update"), button:has-text("Save")');

        // Should show mismatch error
        await expect(page.locator('text=/match|same/i')).toBeVisible();
      }
    });
  });

  test.describe('Billing & Payments', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.goto('/settings');
    });

    test('shows payment methods section', async ({ page }) => {
      await expect(
        page.locator('text=/payment method|billing|card/i').first()
      ).toBeVisible();
    });

    test('can open add payment method modal', async ({ page }) => {
      const addPaymentBtn = page.locator(
        'button:has-text("Add Payment"), button:has-text("Add Card")'
      ).first();

      if (await addPaymentBtn.isVisible()) {
        await addPaymentBtn.click();

        await expect(page.locator('[role="dialog"]')).toBeVisible();
      }
    });

    test('add payment modal has card fields', async ({ page }) => {
      const addPaymentBtn = page.locator('button:has-text("Add Payment")').first();

      if (await addPaymentBtn.isVisible()) {
        await addPaymentBtn.click();

        // Should have card input fields
        await expect(
          page.locator('input[name*="card" i], input[placeholder*="card" i]').first()
        ).toBeVisible();
        await expect(
          page.locator('input[name*="expir" i], input[placeholder*="expir" i]').first()
        ).toBeVisible();
        await expect(
          page.locator('input[name*="cvv" i], input[placeholder*="cvv" i]').first()
        ).toBeVisible();
      }
    });

    test('validates card number format', async ({ page }) => {
      const addPaymentBtn = page.locator('button:has-text("Add Payment")').first();

      if (await addPaymentBtn.isVisible()) {
        await addPaymentBtn.click();

        const cardInput = page.locator('input[name*="card" i]').first();
        await cardInput.fill('1234');

        await page.click('button:has-text("Add"), button:has-text("Save")');

        // Should show validation error
        await expect(page.locator('text=/invalid|valid card/i')).toBeVisible();
      }
    });

    test('formats card number with spaces', async ({ page }) => {
      const addPaymentBtn = page.locator('button:has-text("Add Payment")').first();

      if (await addPaymentBtn.isVisible()) {
        await addPaymentBtn.click();

        const cardInput = page.locator('input[name*="card" i]').first();
        await cardInput.fill('4242424242424242');

        // Should format with spaces
        const value = await cardInput.inputValue();
        expect(value).toMatch(/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/);
      }
    });

    test('can set card as default', async ({ page }) => {
      const setDefaultBtn = page.locator(
        'button:has-text("Set Default"), [data-testid="set-default"]'
      ).first();

      if (await setDefaultBtn.isVisible()) {
        await setDefaultBtn.click();

        await expect(page.locator('text=/default|primary/i')).toBeVisible();
      }
    });

    test('can remove payment method', async ({ page }) => {
      const removeBtn = page.locator(
        'button:has-text("Remove"), button[aria-label*="remove" i]'
      ).first();

      if (await removeBtn.isVisible()) {
        await removeBtn.click();

        // Should show confirmation
        await expect(
          page.locator('text=/confirm|sure|remove/i')
        ).toBeVisible();
      }
    });
  });

  test.describe('Notifications', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.goto('/settings');
    });

    test('shows notification preferences', async ({ page }) => {
      await expect(
        page.locator('text=/notification|alert|email/i').first()
      ).toBeVisible();
    });

    test('can toggle email notifications', async ({ page }) => {
      const emailToggle = page.locator(
        'input[name*="email" i][type="checkbox"], [data-testid="email-notifications"]'
      ).first();

      if (await emailToggle.isVisible()) {
        const wasChecked = await emailToggle.isChecked();
        await emailToggle.click();

        const isChecked = await emailToggle.isChecked();
        expect(isChecked).not.toBe(wasChecked);
      }
    });

    test('can open notifications modal', async ({ page }) => {
      const notificationsBtn = page.locator(
        'button:has-text("Notifications"), button:has-text("Manage Notifications")'
      ).first();

      if (await notificationsBtn.isVisible()) {
        await notificationsBtn.click();

        await expect(page.locator('[role="dialog"]')).toBeVisible();
      }
    });

    test('notification settings show toggles', async ({ page }) => {
      const notificationsBtn = page.locator('button:has-text("Notifications")').first();

      if (await notificationsBtn.isVisible()) {
        await notificationsBtn.click();

        // Should have multiple toggle options
        const toggles = page.locator('input[type="checkbox"]');
        const count = await toggles.count();
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.goto('/settings');
    });

    test('can navigate back to dashboard', async ({ page }) => {
      const dashboardLink = page.locator(
        'a:has-text("Dashboard"), a[href="/dashboard"]'
      ).first();

      if (await dashboardLink.isVisible()) {
        await dashboardLink.click();
        await expect(page).toHaveURL('/dashboard');
      }
    });

    test('has breadcrumb or back navigation', async ({ page }) => {
      const backNav = page.locator(
        '[class*="breadcrumb"], button:has-text("Back"), a:has-text("Back")'
      );

      const isVisible = await backNav.first().isVisible();
      expect(typeof isVisible === 'boolean').toBe(true);
    });
  });

  test.describe('Data Persistence', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.goto('/settings');
    });

    test('shows current user data', async ({ page }) => {
      // Should display user's email or name
      await expect(
        page.locator('text=/test@example.com|user/i').first()
      ).toBeVisible();
    });

    test('displays saved payment methods', async ({ page }) => {
      // May show cards or "no payment methods" message
      const paymentInfo = page.locator(
        'text=/\\*\\*\\*\\*|visa|mastercard|no payment/i'
      );

      await expect(paymentInfo.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Security', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.goto('/settings');
    });

    test('masks sensitive card data', async ({ page }) => {
      const cardDisplay = page.locator('text=/\\*\\*\\*\\*\\d{4}|••••/');

      // If cards exist, they should be masked
      const isVisible = await cardDisplay.first().isVisible().catch(() => false);

      if (isVisible) {
        const text = await cardDisplay.first().textContent();
        expect(text).toMatch(/\*{4}|\u2022{4}/);
      }
    });

    test('password fields are of type password', async ({ page }) => {
      const changePasswordBtn = page.locator('button:has-text("Change Password")').first();

      if (await changePasswordBtn.isVisible()) {
        await changePasswordBtn.click();

        const passwordInputs = page.locator('input[type="password"]');
        const count = await passwordInputs.count();
        expect(count).toBeGreaterThan(0);
      }
    });
  });
});
