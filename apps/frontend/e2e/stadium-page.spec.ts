import { test, expect } from '@playwright/test';
import { StadiumPage } from './pages/stadium.page';
import {
  MATCH_LIST,
  MATCH_LIST_ITEM_1,
  MATCH_ID_1,
  MATCH_SEATS_RESPONSE,
  SEAT_AVAILABLE,
  SEAT_ID_AVAILABLE,
  LOCK_SUCCESS_RESPONSE,
  LOCK_CONFLICT_BODY,
  OWNER_TOKEN,
} from './fixtures/api-mocks';

/**
 * E2E tests for the Stadium Page (/stadium).
 *
 * All backend calls are intercepted via Playwright route mocks.
 * Each test navigates directly to /stadium?matchId=... with a seeded
 * matchId so we always land in a known state.
 *
 * Scenarios:
 *  1. Page renders heading, match selector, stadium map, and colour legend
 *  2. Clicking a sector on the SVG map reveals the seat grid for that sector
 *  3. Seat grid heading shows the correct sector label
 *  4. Clicking an available seat opens the detail panel
 *  5. Detail panel shows seat metadata (row, number, price, status)
 *  6. "Kosárba" click → successful lock → panel shows countdown timer
 *  7. "Kosárba" click → 409 Conflict → snackbar with error message
 *  8. Accessibility toggle filters the seat grid to accessible seats only
 *  9. Empty state renders when no matchId is provided in the URL
 * 10. Match selector navigation updates the URL query param
 */

test.describe('Stadium Page – /stadium', () => {
  // Shared mock setup: register all API mocks before each test.
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/matches', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MATCH_LIST),
      });
    });

    await page.route(`**/api/matches/${MATCH_ID_1}/seats`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MATCH_SEATS_RESPONSE),
      });
    });
  });

  // ---------------------------------------------------------------------------
  // 1. Page structure
  // ---------------------------------------------------------------------------

  test('should render page heading, stadium map, and colour legend', async ({ page }) => {
    const stadium = new StadiumPage(page);
    await stadium.goto(MATCH_ID_1);

    await expect(stadium.pageHeading).toBeVisible();
    await expect(stadium.pageHeading).toContainText('Stadion ülésrend');

    // Stadium map SVG is within the kte-stadium-map component
    await expect(page.locator('kte-stadium-map svg')).toBeVisible();

    // Colour legend
    await expect(page.locator('kte-color-legend')).toBeVisible();
  });

  test('should render the sector summary component', async ({ page }) => {
    const stadium = new StadiumPage(page);
    await stadium.goto(MATCH_ID_1);

    await expect(stadium.sectorSummary).toBeVisible();
  });

  test('should render all four SVG sector buttons on the stadium map', async ({ page }) => {
    const stadium = new StadiumPage(page);
    await stadium.goto(MATCH_ID_1);

    await expect(stadium.sectorA).toBeVisible();
    await expect(stadium.sectorB).toBeVisible();
    await expect(stadium.sectorC).toBeVisible();
    await expect(stadium.sectorVIP).toBeVisible();
  });

  test('should show empty state when no matchId is in the URL', async ({ page }) => {
    const stadium = new StadiumPage(page);
    await stadium.goto(); // no matchId

    await expect(stadium.noMatchEmpty).toBeVisible();
    await expect(stadium.noMatchEmpty).toContainText('Válassz mérkőzést');

    // Seat grid, stadium map content area and sector summary must not be rendered
    await expect(stadium.seatGrid).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // 2. Sector click → seat grid
  // ---------------------------------------------------------------------------

  test('should display seat grid for sector A after clicking it on the stadium map', async ({
    page,
  }) => {
    const stadium = new StadiumPage(page);
    await stadium.goto(MATCH_ID_1);

    await stadium.sectorA.click();

    // Seat grid section appears with the section heading
    await expect(stadium.seatGrid).toBeVisible();
    await expect(stadium.seatGridHeading).toContainText('A');
  });

  test('should render available, locked, and sold seats in the seat grid', async ({ page }) => {
    const stadium = new StadiumPage(page);
    await stadium.goto(MATCH_ID_1);
    await stadium.sectorA.click();

    // Available seats (green, enabled)
    await expect(stadium.availableSeats).toHaveCount(3); // SEAT_AVAILABLE + SEAT_ACCESSIBLE + SEAT_NON_ACCESSIBLE_AVAILABLE

    // Locked seats (orange, disabled)
    const lockedSeats = page.locator('button.kte-seat.kte-seat--locked');
    await expect(lockedSeats).toHaveCount(1);

    // Sold seats (grey, disabled)
    const soldSeats = page.locator('button.kte-seat.kte-seat--sold');
    await expect(soldSeats).toHaveCount(1);
  });

  // ---------------------------------------------------------------------------
  // 3. Seat selection → detail panel
  // ---------------------------------------------------------------------------

  test('should open the seat detail panel when an available seat is clicked', async ({ page }) => {
    const stadium = new StadiumPage(page);
    await stadium.goto(MATCH_ID_1);
    await stadium.sectorA.click();

    const firstAvailable = stadium.availableSeats.first();
    await firstAvailable.click();

    await expect(stadium.seatDetailPanel).toBeVisible();
    // Header should contain row / seat number info
    await expect(stadium.seatDetailHeader).toBeVisible();
  });

  test('should show seat metadata in the detail panel', async ({ page }) => {
    const stadium = new StadiumPage(page);
    await stadium.goto(MATCH_ID_1);
    await stadium.sectorA.click();

    // Click the specific available seat we know from the fixture (row 1, number 5)
    const seatButton = page.locator('button.kte-seat.kte-seat--available').first();
    await seatButton.click();

    await expect(stadium.seatDetailPanel).toBeVisible();

    // Price should be visible in the panel
    await expect(stadium.seatDetailPanel).toContainText('3 500');

    // Status: available → "Szabad"
    await expect(stadium.seatDetailPanel).toContainText('Szabad');

    // "Kosárba" button is enabled for available seats
    await expect(stadium.kosarbaButton).toBeEnabled();
  });

  test('should close the detail panel when the close button is clicked', async ({ page }) => {
    const stadium = new StadiumPage(page);
    await stadium.goto(MATCH_ID_1);
    await stadium.sectorA.click();

    await stadium.availableSeats.first().click();
    await expect(stadium.seatDetailPanel).toBeVisible();

    await stadium.closeButton.click();

    // After closing, the sidenav collapses — the detail aside may be hidden
    // or replaced by the empty-state template. Either way the seat heading is gone.
    await expect(stadium.seatDetailHeader).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // 4. Lock flow — success
  // ---------------------------------------------------------------------------

  test('should show lock countdown in the detail panel after a successful "Kosárba" click', async ({
    page,
  }) => {
    // Override: POST lock → 201 success
    await page.route(
      `**/api/matches/${MATCH_ID_1}/seats/${SEAT_ID_AVAILABLE}/lock`,
      (route) => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify(LOCK_SUCCESS_RESPONSE),
          });
        } else {
          route.continue();
        }
      },
    );

    const stadium = new StadiumPage(page);
    await stadium.goto(MATCH_ID_1);
    await stadium.sectorA.click();

    await stadium.availableSeats.first().click();
    await expect(stadium.kosarbaButton).toBeVisible();
    await stadium.kosarbaButton.click();

    // After a successful lock the panel transitions to the countdown state.
    // The countdown header reads "Hely lefoglalva — MM:SS"
    await expect(stadium.lockCountdownHeader).toBeVisible({ timeout: 5000 });
    await expect(stadium.lockCountdownHeader).toContainText('Hely lefoglalva');

    // Progress bar becomes visible
    await expect(stadium.progressBar).toBeVisible();

    // "Foglalás elengedése" release button appears
    await expect(stadium.releaseButton).toBeVisible();

    // "Kosárba" button is no longer visible (replaced by the lock UI)
    await expect(stadium.kosarbaButton).not.toBeVisible();
  });

  test('should display "Folytatás a kosárba" link to /cart after successful lock', async ({
    page,
  }) => {
    await page.route(
      `**/api/matches/${MATCH_ID_1}/seats/${SEAT_ID_AVAILABLE}/lock`,
      (route) => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify(LOCK_SUCCESS_RESPONSE),
          });
        } else {
          route.continue();
        }
      },
    );

    const stadium = new StadiumPage(page);
    await stadium.goto(MATCH_ID_1);
    await stadium.sectorA.click();
    await stadium.availableSeats.first().click();
    await stadium.kosarbaButton.click();

    await expect(stadium.lockCountdownHeader).toBeVisible({ timeout: 5000 });

    const cartLink = page.getByRole('link', { name: /folytatás a kosárba/i });
    await expect(cartLink).toBeVisible();
    await expect(cartLink).toHaveAttribute('href', /\/cart/);
  });

  // ---------------------------------------------------------------------------
  // 5. Lock flow — 409 conflict
  // ---------------------------------------------------------------------------

  test('should show a snackbar error when the lock API returns 409 Conflict', async ({ page }) => {
    await page.route(
      `**/api/matches/${MATCH_ID_1}/seats/${SEAT_ID_AVAILABLE}/lock`,
      (route) => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify(LOCK_CONFLICT_BODY),
          });
        } else {
          route.continue();
        }
      },
    );

    const stadium = new StadiumPage(page);
    await stadium.goto(MATCH_ID_1);
    await stadium.sectorA.click();

    await stadium.availableSeats.first().click();
    await stadium.kosarbaButton.click();

    // Material snackbar must appear with an error message
    await expect(stadium.snackbar).toBeVisible({ timeout: 5000 });

    // The countdown lock UI must NOT appear
    await expect(stadium.lockCountdownHeader).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // 6. Accessibility toggle
  // ---------------------------------------------------------------------------

  test('should hide non-accessible seats when the accessibility toggle is turned on', async ({
    page,
  }) => {
    const stadium = new StadiumPage(page);
    await stadium.goto(MATCH_ID_1);
    await stadium.sectorA.click();

    // Baseline: there are both accessible and non-accessible available seats
    await expect(stadium.availableSeats).toHaveCount(3);
    const nonAccessibleBefore = stadium.nonAccessibleAvailableSeats;
    await expect(nonAccessibleBefore).toHaveCount(2); // SEAT_AVAILABLE + SEAT_NON_ACCESSIBLE_AVAILABLE

    // Toggle on the accessibility filter
    await stadium.accessibilityToggle.click();

    // After toggling, only accessible seats remain in the grid
    const accessibleSeats = stadium.accessibleSeats;
    await expect(accessibleSeats).toHaveCount(1); // only SEAT_ACCESSIBLE

    // Non-accessible available seats are no longer rendered
    await expect(stadium.nonAccessibleAvailableSeats).toHaveCount(0);
  });

  test('should restore all seats after toggling accessibility filter off again', async ({
    page,
  }) => {
    const stadium = new StadiumPage(page);
    await stadium.goto(MATCH_ID_1);
    await stadium.sectorA.click();

    // Toggle on
    await stadium.accessibilityToggle.click();
    await expect(stadium.availableSeats).toHaveCount(1);

    // Toggle off
    await stadium.accessibilityToggle.click();
    await expect(stadium.availableSeats).toHaveCount(3);
  });

  // ---------------------------------------------------------------------------
  // 7. Match selector navigation
  // ---------------------------------------------------------------------------

  test('should update URL query param when a different match is selected', async ({ page }) => {
    const stadium = new StadiumPage(page);
    // Start without matchId so we can exercise the selector
    await stadium.goto();

    // Intercept the second match's seats endpoint
    const MATCH_ID_2 = MATCH_LIST[1].id;
    await page.route(`**/api/matches/${MATCH_ID_2}/seats`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...MATCH_SEATS_RESPONSE, matchId: MATCH_ID_2 }),
      });
    });

    await stadium.selectMatch('Puskás');

    await expect(page).toHaveURL(new RegExp(`matchId=${MATCH_ID_2}`));
  });

  // ---------------------------------------------------------------------------
  // 8. Lock release (optional unlock flow)
  // ---------------------------------------------------------------------------

  test('should restore the "Kosárba" CTA after releasing a successful lock', async ({ page }) => {
    await page.route(
      `**/api/matches/${MATCH_ID_1}/seats/${SEAT_ID_AVAILABLE}/lock`,
      (route) => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify(LOCK_SUCCESS_RESPONSE),
          });
        } else if (route.request().method() === 'DELETE') {
          route.fulfill({ status: 204 });
        } else {
          route.continue();
        }
      },
    );

    const stadium = new StadiumPage(page);
    await stadium.goto(MATCH_ID_1);
    await stadium.sectorA.click();
    await stadium.availableSeats.first().click();
    await stadium.kosarbaButton.click();

    // Wait for lock countdown to appear
    await expect(stadium.lockCountdownHeader).toBeVisible({ timeout: 5000 });

    // Release the lock
    await stadium.releaseButton.click();

    // After release, the panel returns to the initial CTA state
    // The seats endpoint is re-fetched; a new "Kosárba" button should appear.
    await expect(stadium.kosarbaButton).toBeVisible({ timeout: 5000 });
    await expect(stadium.lockCountdownHeader).not.toBeVisible();
  });
});
