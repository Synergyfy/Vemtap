import { test, expect } from '@playwright/test';

test.describe('AI Copilot Feature', () => {
  const accountCreatedDate = new Date(Date.now() - 5 * 24 * 3600000).toISOString();

  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'vemtap-auth-token',
        value: 'mock-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard');
    await page.evaluate((date) => {
      localStorage.setItem(
        'auth-storage-v2',
        JSON.stringify({
          state: {
            isAuthenticated: true,
            user: { id: 'test-user-1', firstName: 'Alex', createdAt: date },
            accessToken: 'mock-token',
          },
          version: 0,
        }),
      );
    }, accountCreatedDate);
    await page.reload();
  });

  test('should render AI Copilot button in dashboard page header', async ({ page }) => {
    const copilotButton = page.locator('button[aria-label="AI Copilot"]');
    await expect(copilotButton).toBeVisible();
  });

  test('should open AI Copilot drawer when button is clicked', async ({ page }) => {
    const copilotButton = page.locator('button[aria-label="AI Copilot"]');
    await copilotButton.click();

    const drawer = page.locator('aside[aria-label*="copilot"]');
    await expect(drawer).toBeVisible();

    // Verify AI Credits display
    await expect(page.locator('text=AI Credits')).toBeVisible();
  });

  test('should trigger AI analysis when user confirms analysis', async ({ page }) => {
    // Intercept backend /api/ai/analyze call to verify request
    let requestPayload: any = null;
    await page.route('**/ai/analyze', async (route) => {
      requestPayload = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          page: 'dashboard',
          summary: 'Business performance is strong with NGN 450K total revenue.',
          insights: [
            {
              id: 'insight-1',
              type: 'trend',
              severity: 'positive',
              title: 'Revenue Momentum',
              description: 'Tracked revenue reached NGN 450K across all channels.',
              metric: { label: 'Revenue', value: '₦450,000', isUp: true },
            },
          ],
          recommendations: [
            {
              id: 'rec-1',
              title: 'Launch Loyalty Campaign',
              description: 'Boost repeat customer retention.',
              impact: 'high',
              actionLabel: 'Setup Loyalty',
              actionRoute: '/dashboard/loyalty',
            },
          ],
          quickActions: [
            { id: 'qa-1', label: 'View Analytics', icon: 'BarChart3', route: '/dashboard/analytics' },
          ],
          generatedAt: new Date().toISOString(),
          creditsUsed: 1,
        }),
      });
    });

    const copilotButton = page.locator('button[aria-label="AI Copilot"]');
    await copilotButton.click();

    // Click Analyze button inside welcome card
    const analyzeButton = page.locator('button').filter({ hasText: /Analyze Business/i });
    if (await analyzeButton.isVisible()) {
      await analyzeButton.click();
    }

    // Confirm credit usage if confirmation screen appears
    const confirmButton = page.locator('button').filter({ hasText: /Confirm & Analyze/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // Verify backend call payload
    expect(requestPayload).toBeDefined();
    expect(requestPayload.page).toBe('dashboard');

    // Verify rendered summary
    await expect(page.locator('text=Business performance is strong')).toBeVisible();
    await expect(page.locator('text=Revenue Momentum')).toBeVisible();
    await expect(page.locator('text=Launch Loyalty Campaign')).toBeVisible();
  });
});
