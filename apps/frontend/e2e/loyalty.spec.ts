import { test, expect } from '@playwright/test';
import {
  AUTH_RESPONSE,
  AUTH_RESPONSE_GOLD,
  LOYALTY_ME_BRONZE,
  LOYALTY_ME_GOLD_UPGRADED,
  LOYALTY_TIERS,
} from './fixtures/api-mocks';

/**
 * E2E tests for the Loyalty Dashboard – KTE-045.
 *
 * The /loyalty route is a new standalone page added in Iteration 4.
 * All API calls are mocked. No live backend is required.
 *
 * Scenarios:
 *  1.  Authenticated user can navigate to /loyalty
 *  2.  Tier badge renders with the correct tier label
 *  3.  Progress bar is visible
 *  4.  Transaction history table renders with at least one row
 *  5.  Tier upgrade toast appears when tierUpgraded flag is true in the response
 *  6.  No upgrade toast when tierUpgraded is false
 *  7.  Unauthenticated user is redirected away from /loyalty (to /login)
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockRefreshSuccess(
  page: import('@playwright/test').Page,
  authResponse = AUTH_RESPONSE,
): Promise<void> {
  return page.route('**/auth/refresh', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(authResponse),
    }),
  );
}

function mockRefreshFail(page: import('@playwright/test').Page): Promise<void> {
  return page.route('**/auth/refresh', (route) =>
    route.fulfill({ status: 401, body: 'Unauthorized' }),
  );
}

function mockLoyaltyMe(
  page: import('@playwright/test').Page,
  body: unknown = LOYALTY_ME_BRONZE,
): Promise<void> {
  return page.route('**/loyalty/me**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    }),
  );
}

function mockLoyaltyTiers(page: import('@playwright/test').Page): Promise<void> {
  return page.route('**/loyalty/tiers**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(LOYALTY_TIERS),
    }),
  );
}

// ---------------------------------------------------------------------------
// Page locator helpers (inline — no separate PO to keep the file self-contained)
// ---------------------------------------------------------------------------

function tierBadge(page: import('@playwright/test').Page) {
  return page.locator('[data-testid="loyalty-tier-badge"]');
}

function progressBar(page: import('@playwright/test').Page) {
  return page.locator('[data-testid="loyalty-progress-bar"], mat-progress-bar');
}

function transactionTable(page: import('@playwright/test').Page) {
  return page.locator('[data-testid="loyalty-transaction-table"]');
}

function transactionRows(page: import('@playwright/test').Page) {
  // Each data row in the transaction table
  return page.locator('[data-testid="loyalty-transaction-table"] tr[data-testid="loyalty-transaction-row"]');
}

function tierUpgradeToast(page: import('@playwright/test').Page) {
  // Angular Material snack-bar or a custom toast element
  return page.locator('mat-snack-bar-container, [data-testid="tier-upgrade-toast"]');
}

// ---------------------------------------------------------------------------
// Authenticated tests
// ---------------------------------------------------------------------------

test.describe('Loyalty Dashboard – /loyalty (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await mockRefreshSuccess(page);
    await mockLoyaltyMe(page);
    await mockLoyaltyTiers(page);
  });

  test('should render the /loyalty route without redirecting', async ({ page }) => {
    await page.goto('/loyalty');

    // The page must stay at /loyalty — no redirect to /login
    await expect(page).toHaveURL('/loyalty');
    // A top-level section or heading should be visible
    await expect(
      page.getByRole('heading', { name: /hűség/i }).or(page.locator('.kte-loyalty')),
    ).toBeVisible({ timeout: 8000 });
  });

  test('should display the tier badge with the correct tier label', async ({ page }) => {
    await page.goto('/loyalty');

    const badge = tierBadge(page);
    await expect(badge).toBeVisible({ timeout: 8000 });
    // LOYALTY_ME_BRONZE returns tier: 'bronze' → displayed as "Bronz"
    await expect(badge).toContainText('Bronz');
  });

  test('should render a progress bar toward the next tier', async ({ page }) => {
    await page.goto('/loyalty');

    await expect(progressBar(page)).toBeVisible({ timeout: 8000 });
  });

  test('should render the transaction history table with at least one row', async ({ page }) => {
    await page.goto('/loyalty');

    const table = transactionTable(page);
    await expect(table).toBeVisible({ timeout: 8000 });

    // LOYALTY_ME_BRONZE.transactions has 2 entries
    await expect(transactionRows(page)).toHaveCount(2);
  });

  test('should display the transaction reason and points in each table row', async ({ page }) => {
    await page.goto('/loyalty');

    await expect(transactionTable(page)).toBeVisible({ timeout: 8000 });
    // First transaction: "Regisztrációs bónusz" / 100 points
    await expect(transactionRows(page).first()).toContainText('Regisztrációs bónusz');
    await expect(transactionRows(page).first()).toContainText('100');
  });

  test('should NOT show the tier upgrade toast when tierUpgraded is false', async ({ page }) => {
    // LOYALTY_ME_BRONZE has tierUpgraded: false
    await page.goto('/loyalty');

    // Give the page time to settle before asserting absence of toast
    await page.waitForLoadState('networkidle');
    await expect(tierUpgradeToast(page)).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Tier upgrade toast test (gold user with upgrade flag)
// ---------------------------------------------------------------------------

test.describe('Loyalty Dashboard – tier upgrade toast', () => {
  test('should show the tier upgrade toast when tierUpgraded is true', async ({ page }) => {
    await mockRefreshSuccess(page, AUTH_RESPONSE_GOLD);
    await mockLoyaltyMe(page, LOYALTY_ME_GOLD_UPGRADED);
    await mockLoyaltyTiers(page);

    await page.goto('/loyalty');

    // The toast must appear within 5 s of page load (it is triggered on init)
    await expect(tierUpgradeToast(page)).toBeVisible({ timeout: 5000 });
    await expect(tierUpgradeToast(page)).toContainText(/arany|gratulál|szintet lépett/i);
  });

  test('should display the gold tier badge when the user is on the gold tier', async ({ page }) => {
    await mockRefreshSuccess(page, AUTH_RESPONSE_GOLD);
    await mockLoyaltyMe(page, LOYALTY_ME_GOLD_UPGRADED);
    await mockLoyaltyTiers(page);

    await page.goto('/loyalty');

    const badge = tierBadge(page);
    await expect(badge).toBeVisible({ timeout: 8000 });
    await expect(badge).toContainText('Arany');
  });
});

// ---------------------------------------------------------------------------
// Unauthenticated redirect
// ---------------------------------------------------------------------------

test.describe('Loyalty Dashboard – unauthenticated redirect', () => {
  test('should redirect an unauthenticated user from /loyalty to /login', async ({ page }) => {
    await mockRefreshFail(page);

    await page.goto('/loyalty');

    // The Angular AuthGuard redirects to /login with a returnUrl param
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });
});
