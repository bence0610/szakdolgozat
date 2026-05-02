import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for KTE Jegyportál – Iteration 3.
 *
 * Assumptions:
 *  - The Angular dev server runs on http://localhost:4200
 *  - The NestJS API runs on http://localhost:3000
 *  - CI sets CI=true; locally the browser is headed by default.
 *
 * Run:  npx playwright test --config apps/frontend/e2e/playwright.config.ts
 *
 * Iteration 3 changes:
 *  - Added `auth-setup` project that runs auth.setup.ts to produce a
 *    storage-state file used by tests that require authentication.
 *  - Chromium, Firefox, and mobile-chrome projects list `auth-setup` as a
 *    dependency so the setup runs once per worker group.
 */
export default defineConfig({
  testDir: './',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  workers: process.env['CI'] ? 2 : undefined,

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: process.env['APP_BASE_URL'] ?? 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    locale: 'hu-HU',
    timezoneId: 'Europe/Budapest',
  },

  projects: [
    // ---------------------------------------------------------------------------
    // Setup project — runs auth.setup.ts once to produce .auth/user.json.
    // The browser context created here is not shared with test projects.
    // ---------------------------------------------------------------------------
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // ---------------------------------------------------------------------------
    // Test projects — depend on auth-setup so the storageState file exists.
    // Tests that don't need auth simply don't use the storageState fixture.
    // ---------------------------------------------------------------------------
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['auth-setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['auth-setup'],
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['auth-setup'],
    },
  ],

  webServer: {
    command: 'npx ng serve --configuration development',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
    cwd: '../',
  },
});
