import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './apps/VemTap/tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 60 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm --filter entryconect exec next dev --webpack --port 3000',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000,
  },
});
