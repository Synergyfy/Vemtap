import { expect, test } from '@playwright/test';

test.describe('Landing Page', () => {
  test('loads homepage hero content', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByRole('heading', { name: /collect customer details/i })
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /get started/i })).toBeVisible();
  });

  test('navigates to get started from CTA', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: /get started/i }).first().click();
    await expect(page).toHaveURL(/\/get-started$/);
  });
});
