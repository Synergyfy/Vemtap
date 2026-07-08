import { test, expect } from '@playwright/test';

test.describe('Product Modal Responsiveness', () => {
  test.beforeEach(async ({ page }) => {
    // Mocking auth and business data
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-storage-v2', JSON.stringify({
        state: {
          user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
          token: 'fake-token',
        }
      }));
    });

    // Set cookie for middleware
    await page.context().addCookies([{
      name: 'vemtap-auth-token',
      value: 'fake-token',
      domain: 'localhost',
      path: '/',
    }]);

    // Intercept API calls - using **/api/v1/** to match normalizeBaseUrl logic
    await page.route('**/api/v1/businesses/my', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'biz-1',
          name: 'Test Business',
          branches: [{ id: 'branch-1', name: 'Main Branch' }]
        }),
      });
    });

    await page.route('**/api/v1/catalogue/categories', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'cat-1', name: 'Electronics' },
          { id: 'cat-2', name: 'Food' },
        ]),
      });
    });

    await page.route('**/api/v1/catalogue/items*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
  });

  test('should display product modal correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard/inventory');

    // Wait for the page to load
    await page.waitForSelector('button:has-text("Add Product")');
    await page.click('button:has-text("Add Product")');

    // Wait for method modal and select manual
    await page.waitForSelector('text=Manual Entry');
    await page.click('text=Manual Entry');

    // Wait for product modal
    await page.waitForSelector('h3:has-text("Add Product")');

    // Take screenshot of Step 1 (Details)
    await page.screenshot({ path: 'product-modal-desktop-step1.png' });

    // Fill required fields for Step 0
    await page.fill('input[name="name"]', 'Test Product');
    await page.selectOption('select[name="categoryId"]', 'cat-1');
    await page.fill('textarea[name="description"]', 'Test Description');

    // Click Next
    await page.click('button:has-text("Next")');

    // Wait for Pricing step
    await page.waitForSelector('text=Original Price');

    // Fill required fields for Step 1
    await page.fill('input[name="price"]', '1000');
    await page.selectOption('select[name="branchId"]', 'branch-1');

    // Take screenshot of Step 2 (Pricing)
    await page.screenshot({ path: 'product-modal-desktop-step2.png' });
  });

  test('should display product modal correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard/inventory');

    // Wait for the page to load
    await page.waitForSelector('button:has-text("Add Product")');
    await page.click('button:has-text("Add Product")');

    // Wait for method modal and select manual
    await page.waitForSelector('text=Manual Entry');
    await page.click('text=Manual Entry');

    // Wait for product modal
    await page.waitForSelector('h3:has-text("Add Product")');

    // Take screenshot of Step 1 (Details)
    await page.screenshot({ path: 'product-modal-mobile-step1.png' });

    // Fill required fields for Step 0
    await page.fill('input[name="name"]', 'Test Product');
    await page.selectOption('select[name="categoryId"]', 'cat-1');
    await page.fill('textarea[name="description"]', 'Test Description');

    // Click Next
    await page.click('button:has-text("Next")');

    // Wait for Pricing step
    await page.waitForSelector('text=Original Price');

    // Fill required fields for Step 1
    await page.fill('input[name="price"]', '1000');
    await page.selectOption('select[name="branchId"]', 'branch-1');

    // Take screenshot of Step 2 (Pricing)
    await page.screenshot({ path: 'product-modal-mobile-step2.png' });
  });

  test('should display receive stock page correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard/inventory/receiving');

    // Wait for the page to load
    await page.waitForSelector('h1:has-text("Receive Stock")');

    // Take screenshot
    await page.screenshot({ path: 'receive-stock-mobile.png' });

    // Check if Receive Stock button is visible
    const receiveButton = page.locator('button:has-text("Receive Stock")');
    await expect(receiveButton).toBeVisible();
  });
});
