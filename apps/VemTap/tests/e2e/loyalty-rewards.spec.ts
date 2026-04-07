import { test, expect } from '@playwright/test';

test.describe('Loyalty Rewards Management', () => {
  test('should create a reward with infinity quantity', async ({ page }) => {
    // 1. Mock the login or use a stored state if available
    // For this e2e, we'll assume the user needs to login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'owner@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // 2. Navigate to Rewards page
    await page.waitForURL('/dashboard/loyalty/rewards');
    await expect(page.getByRole('heading', { name: /reward manager/i })).toBeVisible();

    // 3. Open Creation Modal
    await page.click('button:has-text("New Reward")');
    await expect(page.getByText('New Creation')).toBeVisible();

    // 4. Fill form
    await page.fill('input[placeholder="e.g. Complimentary Cappuccino"]', 'Infinity Coffee');
    await page.fill('textarea[placeholder*="Tell customers"]', 'Unlimited free coffee for our best fans!');
    
    // 5. Set Infinity
    const infinityButton = page.getByRole('button', { name: /set unlimited/i });
    await infinityButton.click();
    await expect(page.getByText('Infinity')).toBeVisible();

    // 6. Submit
    await page.click('button:has-text("Confirm & Launch")');

    // 7. Verify Success
    await expect(page.getByText('Reward created successfully')).toBeVisible();
    await expect(page.getByText('Infinity Coffee')).toBeVisible();
  });
});
