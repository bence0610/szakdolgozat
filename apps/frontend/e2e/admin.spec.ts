import { test, expect } from '@playwright/test';
import { AdminPage } from './pages/admin.page';
import {
  AUTH_RESPONSE,
  AUTH_RESPONSE_ADMIN,
  MATCH_ID_1,
  MATCH_ID_2,
  MATCH_LIST,
  MATCH_LIST_ITEM_1,
  MATCH_LIST_ITEM_2,
  ADMIN_REVENUE_STATS,
  ADMIN_OCCUPANCY,
} from './fixtures/api-mocks';

/**
 * E2E tests for the Admin section – KTE-061, KTE-062, KTE-063 (Iteration 5).
 *
 * Three concerns are tested:
 *
 *  A) Admin Guard (KTE-063)
 *     - FAN role authenticated user is redirected to / when hitting /admin
 *     - Unauthenticated user is redirected to /login
 *     - ADMIN role user can access /admin/revenue and /admin/heatmap
 *
 *  B) Revenue Stats page – /admin/revenue (KTE-062)
 *     - Loading spinner appears while stats are fetched
 *     - Three summary cards render with the correct labels
 *     - Match breakdown table is visible
 *
 *  C) Seat Heatmap page – /admin/heatmap (KTE-061)
 *     - SVG heatmap is rendered when data is available
 *     - Match picker is present
 *     - Changing the selected match triggers a new occupancy API call
 *     - Occupancy summary (percentage, sold/locked/available) is shown
 *
 * All API calls are mocked — no real backend is needed.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockRefreshFan(page: import('@playwright/test').Page): Promise<void> {
  return page.route('**/auth/refresh', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      // AUTH_RESPONSE.user.role === 'fan' — blocked by adminGuard
      body: JSON.stringify(AUTH_RESPONSE),
    }),
  );
}

function mockRefreshAdmin(page: import('@playwright/test').Page): Promise<void> {
  return page.route('**/auth/refresh', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(AUTH_RESPONSE_ADMIN),
    }),
  );
}

function mockRefreshFail(page: import('@playwright/test').Page): Promise<void> {
  return page.route('**/auth/refresh', (route) =>
    route.fulfill({ status: 401, body: 'Unauthorized' }),
  );
}

function mockMatches(page: import('@playwright/test').Page): Promise<void> {
  return page.route('**/api/matches**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MATCH_LIST),
    }),
  );
}

function mockRevenue(page: import('@playwright/test').Page): Promise<void> {
  return page.route('**/admin/revenue**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(ADMIN_REVENUE_STATS),
    }),
  );
}

function mockRevenueLoading(page: import('@playwright/test').Page): Promise<void> {
  return page.route('**/admin/revenue**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(ADMIN_REVENUE_STATS),
    });
  });
}

function mockOccupancy(
  page: import('@playwright/test').Page,
  matchId = MATCH_ID_1,
): Promise<void> {
  return page.route(`**/admin/matches/${matchId}/occupancy`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...ADMIN_OCCUPANCY, matchId }),
    }),
  );
}

// ---------------------------------------------------------------------------
// A) Admin Guard tests (KTE-063)
// ---------------------------------------------------------------------------

test.describe('Admin Guard – KTE-063', () => {
  test('should redirect a FAN role user from /admin to /', async ({ page }) => {
    await mockRefreshFan(page);

    await page.goto('/admin');

    // adminGuard resolves to router.createUrlTree(['/']), so the final URL
    // should be the root of the application.
    await expect(page).toHaveURL('/', { timeout: 5000 });
  });

  test('should redirect an unauthenticated user from /admin to /login', async ({ page }) => {
    await mockRefreshFail(page);

    await page.goto('/admin');

    // Guard checks isAuthenticated() first → redirects to /login with returnUrl
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('should allow an ADMIN role user to access /admin/revenue', async ({ page }) => {
    await mockRefreshAdmin(page);
    await mockRevenue(page);
    await mockMatches(page);

    await page.goto('/admin/revenue');

    // The AdminPage header must render — guard did not redirect
    const admin = new AdminPage(page);
    await expect(admin.pageHeading).toBeVisible({ timeout: 5000 });
  });

  test('should allow an ADMIN role user to access /admin/heatmap', async ({ page }) => {
    await mockRefreshAdmin(page);
    await mockMatches(page);
    await mockOccupancy(page);

    await page.goto('/admin/heatmap');

    const admin = new AdminPage(page);
    await expect(admin.pageHeading).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// B) Revenue Stats page (KTE-062)
// ---------------------------------------------------------------------------

test.describe('Admin Revenue Stats – /admin/revenue (KTE-062)', () => {
  test.beforeEach(async ({ page }) => {
    await mockRefreshAdmin(page);
    await mockMatches(page);
  });

  test('should show a loading spinner while revenue data is being fetched', async ({ page }) => {
    await mockRevenueLoading(page);

    await page.goto('/admin/revenue');
    const admin = new AdminPage(page);

    await expect(admin.revenueLoader).toBeVisible();
  });

  test('should render three revenue summary cards when stats are loaded', async ({ page }) => {
    await mockRevenue(page);

    await page.goto('/admin/revenue');
    const admin = new AdminPage(page);

    // The template renders one card for "Mai bevétel", one for "Havi bevétel",
    // and one for "Legjobb meccs" (conditional — present when topMatch is set).
    await expect(admin.revenueSummaryCards).toHaveCount(3, { timeout: 5000 });
  });

  test('should render the "Mai bevétel" summary card with the correct label', async ({ page }) => {
    await mockRevenue(page);

    await page.goto('/admin/revenue');
    const admin = new AdminPage(page);

    await expect(admin.revenueSummaryCards).toHaveCount(3, { timeout: 5000 });
    await expect(admin.revenueSummaryCards.first()).toContainText('Mai bevétel');
  });

  test('should render the line chart component', async ({ page }) => {
    await mockRevenue(page);

    await page.goto('/admin/revenue');
    const admin = new AdminPage(page);

    await expect(admin.revenueLineChart).toBeVisible({ timeout: 5000 });
  });

  test('should render the match breakdown table', async ({ page }) => {
    await mockRevenue(page);

    await page.goto('/admin/revenue');
    const admin = new AdminPage(page);

    await expect(admin.revenueMatchTable).toBeVisible({ timeout: 5000 });
    // The table shows match names — verify a known one from the fixture
    await expect(admin.revenueMatchTable).toContainText(MATCH_LIST_ITEM_1.homeTeam);
  });

  test('should show the navigation links to revenue and heatmap sub-pages', async ({ page }) => {
    await mockRevenue(page);

    await page.goto('/admin/revenue');
    const admin = new AdminPage(page);

    await expect(admin.revenueNavLink).toBeVisible({ timeout: 5000 });
    await expect(admin.heatmapNavLink).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// C) Seat Heatmap page (KTE-061)
// ---------------------------------------------------------------------------

test.describe('Admin Seat Heatmap – /admin/heatmap (KTE-061)', () => {
  test.beforeEach(async ({ page }) => {
    await mockRefreshAdmin(page);
  });

  test('should render the SVG heatmap when match occupancy data is available', async ({ page }) => {
    await mockMatches(page);
    await mockOccupancy(page);

    await page.goto('/admin/heatmap');
    const admin = new AdminPage(page);

    // The SVG is rendered by StadiumHeatmapComponent with role="img"
    await expect(admin.heatmapSvg).toBeVisible({ timeout: 5000 });
    await expect(admin.heatmapSvg).toHaveAttribute(
      'aria-label',
      /stadion foglaltsági heatmap/i,
    );
  });

  test('should display the match picker component', async ({ page }) => {
    await mockMatches(page);
    await mockOccupancy(page);

    await page.goto('/admin/heatmap');
    const admin = new AdminPage(page);

    await expect(admin.heatmapMatchPicker).toBeVisible({ timeout: 5000 });
  });

  test('should show the occupancy summary with percentage and seat counts', async ({ page }) => {
    await mockMatches(page);
    await mockOccupancy(page);

    await page.goto('/admin/heatmap');
    const admin = new AdminPage(page);

    await expect(admin.heatmapSummary).toBeVisible({ timeout: 5000 });
    // Percentage from ADMIN_OCCUPANCY.occupancyPercent = 41
    await expect(admin.heatmapSummary).toContainText(`${ADMIN_OCCUPANCY.occupancyPercent}%`);
    // Total sold
    await expect(admin.heatmapSummary).toContainText(String(ADMIN_OCCUPANCY.totalSold));
  });

  test('should load new occupancy data when a different match is selected in the picker', async ({
    page,
  }) => {
    let occupancyCallCount = 0;

    // First call — initial load for MATCH_ID_1
    await page.route(`**/admin/matches/${MATCH_ID_1}/occupancy`, (route) => {
      occupancyCallCount += 1;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ADMIN_OCCUPANCY),
      });
    });

    // Second call — triggered after the user picks MATCH_ID_2
    const occupancy2 = { ...ADMIN_OCCUPANCY, matchId: MATCH_ID_2, occupancyPercent: 25 };
    await page.route(`**/admin/matches/${MATCH_ID_2}/occupancy`, (route) => {
      occupancyCallCount += 1;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(occupancy2),
      });
    });

    await mockMatches(page);

    await page.goto('/admin/heatmap');
    const admin = new AdminPage(page);

    // Wait for the initial heatmap to render
    await expect(admin.heatmapSvg).toBeVisible({ timeout: 5000 });
    expect(occupancyCallCount).toBe(1);

    // Open the mat-select and pick the second match
    await admin.heatmapMatchPicker.getByRole('combobox').click();
    await page
      .getByRole('option', { name: new RegExp(MATCH_LIST_ITEM_2.awayTeam, 'i') })
      .click();

    // The component calls loadOccupancy() again — a second API request fires
    await page.waitForResponse(
      (resp) => resp.url().includes(MATCH_ID_2) && resp.url().includes('occupancy'),
    );
    expect(occupancyCallCount).toBe(2);

    // The new occupancy percentage is reflected in the summary
    await expect(admin.heatmapSummary).toContainText('25%', { timeout: 5000 });
  });

  test('should show a loading indicator while occupancy data is fetching', async ({ page }) => {
    await mockMatches(page);

    // Delay the first occupancy response so we can observe the spinner
    await page.route(`**/admin/matches/${MATCH_ID_1}/occupancy`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ADMIN_OCCUPANCY),
      });
    });

    await page.goto('/admin/heatmap');
    const admin = new AdminPage(page);

    await expect(admin.heatmapLoader).toBeVisible();
  });

  test('should navigate to the revenue page when the "Bevételi statisztikák" nav link is clicked', async ({
    page,
  }) => {
    await mockMatches(page);
    await mockOccupancy(page);
    await mockRevenue(page);

    await page.goto('/admin/heatmap');
    const admin = new AdminPage(page);

    await expect(admin.revenueNavLink).toBeVisible({ timeout: 5000 });
    await admin.revenueNavLink.click();

    await expect(page).toHaveURL(/\/admin\/revenue/, { timeout: 5000 });
    await expect(admin.revenueSummaryCards).toHaveCount(3, { timeout: 5000 });
  });
});
