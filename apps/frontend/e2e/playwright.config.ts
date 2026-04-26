import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for KTE Jegyportál – Iteration 2.
 *
 * Assumptions:
 *  - The Angular dev server runs on http://localhost:4200
 *  - The NestJS API runs on http://localhost:3000
 *  - CI sets CI=true; locally the browser is headed by default.
 *
 * Run:  npx playwright test --config apps/frontend/e2e/playwright.config.ts
 */
export default defineConfig({
  testDir: './',
  /* Each test file gets its own isolated browser context. */
  fullyParallel: true,
  /* Fail-fast in CI: no retries waste time on genuine bugs. */
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  workers: process.env['CI'] ? 2 : undefined,

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: process.env['APP_BASE_URL'] ?? 'http://localhost:4200',
    /* Every test gets a fresh context — no auth/session leakage. */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    /* Generous timeout for Angular hydration on first load. */
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    locale: 'hu-HU',
    timezoneId: 'Europe/Budapest',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  /* Start Angular dev server before the test run if it is not already up. */
  webServer: {
    command: 'npx ng serve --configuration development',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
    cwd: '../',
  },
});
