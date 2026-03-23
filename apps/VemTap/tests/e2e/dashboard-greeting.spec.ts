import { test, expect } from '@playwright/test';

test.describe('Dashboard Greeting', () => {
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 3600000).toISOString();

  test('should show welcome message for new user', async ({ page, context }) => {
    // Set cookie for middleware
    await context.addCookies([{
      name: 'vemtap-auth-token',
      value: 'mock-token',
      domain: 'localhost',
      path: '/'
    }]);

    await page.goto('/dashboard');
    await page.evaluate((date) => {
      localStorage.setItem('auth-storage-v2', JSON.stringify({
        state: {
          isAuthenticated: true,
          user: { firstName: 'Newbie', createdAt: date },
          accessToken: 'mock-token'
        },
        version: 0
      }));
    }, oneHourAgo);
    await page.reload();

    await expect(page.locator('h1')).toHaveText('Welcome to VemTap, Newbie!');
    await expect(page.locator('p').filter({ hasText: "We're excited to have you here" })).toBeVisible();
  });

  test('should show standard dashboard title for returning user', async ({ page, context }) => {
    // Set cookie for middleware
    await context.addCookies([{
      name: 'vemtap-auth-token',
      value: 'mock-token',
      domain: 'localhost',
      path: '/'
    }]);

    await page.goto('/dashboard');
    await page.evaluate((date) => {
      localStorage.setItem('auth-storage-v2', JSON.stringify({
        state: {
          isAuthenticated: true,
          user: { firstName: 'Veteran', createdAt: date },
          accessToken: 'mock-token'
        },
        version: 0
      }));
    }, twoDaysAgo);
    await page.reload();

    await expect(page.locator('h1')).toHaveText('Dashboard');
    await expect(page.locator('p').filter({ hasText: "Welcome back! Here's what's happening today." })).toBeVisible();
  });
});
