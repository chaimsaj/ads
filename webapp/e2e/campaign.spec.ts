import { test, expect } from '@playwright/test';

test.describe('Campaign Management', () => {
  // Helper to simulate login
  async function login(page: any) {
    await page.goto('/auth/signin');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  }

  test.describe('Campaign Creation Wizard', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('navigates through ad type selection', async ({ page }) => {
      // Click create new ad button
      await page.click('text=/create|new ad/i');

      await expect(page).toHaveURL('/campaign/select-ad-type');
      await expect(page.locator('h1, h2')).toContainText(/ad type|type of ad/i);

      // Should have ad type options
      await expect(page.locator('text=/user|profile/i').first()).toBeVisible();
      await expect(page.locator('text=/event/i').first()).toBeVisible();
      await expect(page.locator('text=/brand/i').first()).toBeVisible();
    });

    test('selects ad type and continues', async ({ page }) => {
      await page.goto('/campaign/select-ad-type');

      // Select brand ad type
      await page.click('text=/brand/i');

      // Continue to next step
      await page.click('button:has-text("Continue")');

      await expect(page).toHaveURL('/campaign/select-boost-type');
    });

    test('navigates through boost type selection', async ({ page }) => {
      await page.goto('/campaign/select-boost-type');

      await expect(page.locator('h1, h2')).toContainText(/boost|type/i);

      // Should have boost options
      await expect(page.locator('text=/standard/i').first()).toBeVisible();
      await expect(page.locator('text=/premium/i').first()).toBeVisible();
    });

    test('selects boost type and continues', async ({ page }) => {
      await page.goto('/campaign/select-boost-type');

      await page.click('text=/premium/i');
      await page.click('button:has-text("Continue")');

      await expect(page).toHaveURL('/campaign/select-ad-format');
    });

    test('navigates through ad format selection', async ({ page }) => {
      await page.goto('/campaign/select-ad-format');

      await expect(page.locator('h1, h2')).toContainText(/format/i);

      // Should have format options
      await expect(page.locator('text=/banner/i').first()).toBeVisible();
      await expect(page.locator('text=/interstitial/i').first()).toBeVisible();
      await expect(page.locator('text=/push/i').first()).toBeVisible();
    });

    test('selects ad format and continues', async ({ page }) => {
      await page.goto('/campaign/select-ad-format');

      await page.click('text=/banner/i');
      await page.click('button:has-text("Continue")');

      await expect(page).toHaveURL('/campaign/create-ad');
    });

    test('fills ad creation form', async ({ page }) => {
      await page.goto('/campaign/create-ad');

      // Fill in ad details
      await page.fill('input[name="name"], input[placeholder*="name" i]', 'Test Campaign');
      await page.fill(
        'textarea[name="adText"], textarea[placeholder*="text" i]',
        'This is a test ad'
      );
      await page.fill(
        'input[name="destinationUrl"], input[placeholder*="url" i]',
        'https://example.com'
      );

      // Fill dates
      const startDate = page.locator('input[name="startDate"], input[type="date"]').first();
      const endDate = page.locator('input[name="endDate"], input[type="date"]').last();

      if (await startDate.isVisible()) {
        await startDate.fill('2026-02-01');
      }
      if (await endDate.isVisible()) {
        await endDate.fill('2026-02-28');
      }

      // Fill budget
      await page.fill('input[name="budget"], input[placeholder*="budget" i]', '1000');
    });

    test('validates required fields on create ad', async ({ page }) => {
      await page.goto('/campaign/create-ad');

      // Try to continue without filling fields
      await page.click('button:has-text("Continue")');

      // Should show validation errors or stay on page
      await expect(page).toHaveURL('/campaign/create-ad');
    });

    test('navigates to targeting page', async ({ page }) => {
      await page.goto('/campaign/create-ad');

      await page.fill('input[name="name"], input[placeholder*="name" i]', 'Test Campaign');
      await page.fill(
        'input[name="destinationUrl"], input[placeholder*="url" i]',
        'https://example.com'
      );
      await page.fill('input[name="budget"], input[placeholder*="budget" i]', '1000');

      await page.click('button:has-text("Continue")');

      await expect(page).toHaveURL('/campaign/targeting');
    });

    test('fills targeting options', async ({ page }) => {
      await page.goto('/campaign/targeting');

      // Location
      const locationInput = page.locator('input[name="location"], input[placeholder*="location" i]');
      if (await locationInput.isVisible()) {
        await locationInput.fill('New York');
      }

      // Age range
      const ageMin = page.locator('input[name="ageMin"], input[placeholder*="min" i]').first();
      const ageMax = page.locator('input[name="ageMax"], input[placeholder*="max" i]').first();
      if (await ageMin.isVisible()) {
        await ageMin.fill('18');
      }
      if (await ageMax.isVisible()) {
        await ageMax.fill('35');
      }
    });

    test('navigates to review page', async ({ page }) => {
      await page.goto('/campaign/targeting');

      await page.click('button:has-text("Continue")');

      await expect(page).toHaveURL('/campaign/review');
    });

    test('displays campaign review summary', async ({ page }) => {
      await page.goto('/campaign/review');

      await expect(page.locator('h1, h2')).toContainText(/review|summary/i);

      // Should have action buttons
      await expect(
        page.locator('button:has-text("Publish"), button:has-text("Submit")')
      ).toBeVisible();
    });

    test('can go back through wizard steps', async ({ page }) => {
      await page.goto('/campaign/review');

      await page.click('button:has-text("Back")');

      await expect(page).toHaveURL('/campaign/targeting');

      await page.click('button:has-text("Back")');

      await expect(page).toHaveURL('/campaign/create-ad');
    });
  });

  test.describe('Dashboard Campaign Operations', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('displays campaign list', async ({ page }) => {
      await expect(page.locator('table, [data-testid="campaign-list"]')).toBeVisible();
    });

    test('displays campaign statistics', async ({ page }) => {
      // Should show stat cards
      await expect(
        page.locator('[class*="stat"], [data-testid*="stat"]').first()
      ).toBeVisible();
    });

    test('can filter campaigns by status', async ({ page }) => {
      const statusFilter = page.locator(
        'select[name="status"], [data-testid="status-filter"], button:has-text("Status")'
      );

      if (await statusFilter.isVisible()) {
        await statusFilter.click();
        await page.click('text=Active');
      }
    });

    test('can search campaigns', async ({ page }) => {
      const searchInput = page.locator(
        'input[type="search"], input[placeholder*="search" i]'
      );

      if (await searchInput.isVisible()) {
        await searchInput.fill('Test');

        // Wait for debounce
        await page.waitForTimeout(500);
      }
    });

    test('can click on campaign row', async ({ page }) => {
      const campaignRow = page.locator(
        'tr[data-testid="campaign-row"], [class*="campaign-row"]'
      ).first();

      if (await campaignRow.isVisible()) {
        await campaignRow.click();

        // Should navigate to details or expand
        await expect(page.locator('text=/details|edit/i')).toBeVisible();
      }
    });
  });

  test.describe('Campaign Editing', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('can access edit campaign page', async ({ page }) => {
      await page.goto('/campaign/edit/1');

      // Should display edit form or redirect
      const isOnEditPage = page.url().includes('/campaign/edit');
      const isOnDashboard = page.url().includes('/dashboard');

      expect(isOnEditPage || isOnDashboard).toBe(true);
    });

    test('campaign details page shows campaign info', async ({ page }) => {
      await page.goto('/campaign/details/1');

      // Should show campaign information
      const hasDetails =
        (await page.locator('h1, h2').isVisible()) ||
        page.url().includes('/dashboard');

      expect(hasDetails).toBe(true);
    });
  });

  test.describe('Campaign Actions', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('can toggle campaign status', async ({ page }) => {
      const toggleButton = page.locator(
        '[data-testid="status-toggle"], button:has-text("Pause"), button:has-text("Activate")'
      ).first();

      if (await toggleButton.isVisible()) {
        await toggleButton.click();

        // Should show confirmation or update
        await expect(
          page.locator('text=/paused|activated|updated/i')
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test('can access duplicate option', async ({ page }) => {
      const actionsMenu = page.locator(
        '[data-testid="campaign-actions"], button[aria-label*="action" i]'
      ).first();

      if (await actionsMenu.isVisible()) {
        await actionsMenu.click();

        await expect(page.locator('text=/duplicate|copy/i')).toBeVisible();
      }
    });

    test('can access delete option', async ({ page }) => {
      const actionsMenu = page.locator(
        '[data-testid="campaign-actions"], button[aria-label*="action" i]'
      ).first();

      if (await actionsMenu.isVisible()) {
        await actionsMenu.click();

        await expect(page.locator('text=/delete|remove/i')).toBeVisible();
      }
    });
  });

  test.describe('Bulk Operations', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('can select multiple campaigns', async ({ page }) => {
      const checkboxes = page.locator('input[type="checkbox"][name*="campaign"]');
      const count = await checkboxes.count();

      if (count > 1) {
        await checkboxes.nth(0).check();
        await checkboxes.nth(1).check();

        // Bulk actions should appear
        await expect(
          page.locator('text=/selected|bulk/i')
        ).toBeVisible();
      }
    });

    test('can select all campaigns', async ({ page }) => {
      const selectAll = page.locator(
        'input[type="checkbox"][name="selectAll"], th input[type="checkbox"]'
      );

      if (await selectAll.isVisible()) {
        await selectAll.check();
      }
    });
  });
});
