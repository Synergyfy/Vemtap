import { expect, test } from '@playwright/test';

test.describe('Landing Page', () => {
  test('loads homepage hero content', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByRole('heading', { name: /discover what's near you/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /find what's near me/i }).first()
    ).toBeVisible();
  });

  test('navigates to deals from explore CTA', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: /explore vemtap/i }).first().click();
    await expect(page).toHaveURL(/\/deals/);
  });
});
