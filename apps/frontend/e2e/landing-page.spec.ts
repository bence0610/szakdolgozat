import { test, expect } from '@playwright/test';
import { HomePage } from './pages/home.page';
import {
  MATCH_LIST,
  MATCH_LIST_ITEM_1,
  MATCH_LIST_ITEM_2,
  MATCH_ID_1,
} from './fixtures/api-mocks';

/**
 * E2E tests for the Landing Page (/).
 *
 * All API calls are intercepted with Playwright route mocks so the tests run
 * without a live backend.  Each test is fully isolated — no shared state
 * between tests.
 *
 * Scenarios:
 *  1. Landing page renders hero, countdown, and match list
 *  2. Countdown shows correct team names and date
 *  3. Match list renders one card per match
 *  4. Match card shows all expected metadata
 *  5. Clicking "Jegyvásárlás" navigates to /stadium with correct matchId
 *  6. Loading spinner appears while API call is pending
 *  7. Error state renders when API returns 500
 *  8. Empty state renders when API returns an empty list
 */

test.describe('Landing Page – /home', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept all matches calls (the home page dispatches two: loadMatches and loadUpcoming)
    await page.route('**/api/matches', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MATCH_LIST),
      });
    });
    await page.route('**/api/matches/upcoming', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([MATCH_LIST_ITEM_1]),
      });
    });
  });

  test('should render the hero section with heading and CTA buttons', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    await expect(home.heroSection).toBeVisible();
    await expect(home.heroTitle).toContainText('Élj át minden gólt');
    await expect(home.heroCtaBuyTickets).toBeVisible();
    await expect(home.heroCtaSeasonPass).toBeVisible();
  });

  test('should display the hero CTA links with correct hrefs', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    await expect(home.heroCtaBuyTickets).toHaveAttribute('href', /\/stadium/);
    await expect(home.heroCtaSeasonPass).toHaveAttribute('href', /\/profile/);
  });

  test('should render the countdown card with the next upcoming match', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    await expect(home.countdownCard).toBeVisible();

    // The countdown header shows "Következő mérkőzés"
    await expect(home.countdownCard).toContainText('Következő mérkőzés');

    // Team names appear in the matchup heading
    await expect(home.countdownMatchup).toContainText(MATCH_LIST_ITEM_1.homeTeam);
    await expect(home.countdownMatchup).toContainText(MATCH_LIST_ITEM_1.awayTeam);

    // Countdown grid (days/hours/minutes/seconds cells) is visible for a future match
    await expect(home.countdownGrid).toBeVisible();
    const cells = home.countdownGrid.locator('.kte-countdown__cell');
    await expect(cells).toHaveCount(4);
  });

  test('should render the match list heading', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    await expect(home.matchListHeading).toContainText('Aktuális mérkőzések');
  });

  test('should render one match card per API response item', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    await expect(home.matchCards).toHaveCount(MATCH_LIST.length);
  });

  test('should display correct team names, status, and seat count in the first card', async ({
    page,
  }) => {
    const home = new HomePage(page);
    await home.goto();

    const firstCard = home.matchCard(0);

    const { home: homeTeam, away: awayTeam } = home.teamNamesInCard(firstCard);
    await expect(homeTeam).toContainText(MATCH_LIST_ITEM_1.homeTeam);
    await expect(awayTeam).toContainText(MATCH_LIST_ITEM_1.awayTeam);

    // Status badge: on_sale → "Kapható"
    await expect(home.statusBadgeInCard(firstCard)).toContainText('Kapható');

    // Available seat count
    await expect(firstCard).toContainText(String(MATCH_LIST_ITEM_1.availableSeats));
  });

  test('should show the Hazai badge on a home match card', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    const firstCard = home.matchCard(0);
    // isHome === true → "Hazai" badge
    await expect(firstCard.locator('.kte-match-card__badge--home')).toContainText('Hazai');
  });

  test('should navigate to /stadium with matchId query param when Jegyvásárlás is clicked', async ({
    page,
  }) => {
    const home = new HomePage(page);
    await home.goto();

    // Wait for match cards to render before interacting
    await expect(home.matchCards).toHaveCount(MATCH_LIST.length);

    const firstCard = home.matchCard(0);
    const buyButton = home.buyTicketsButtonInCard(firstCard);

    await buyButton.click();

    await expect(page).toHaveURL(new RegExp(`/stadium.*matchId=${MATCH_ID_1}`));
  });

  test('should show loading spinner while the matches API call is pending', async ({ page }) => {
    // Override the default route mock with a delayed one
    await page.route('**/api/matches', async (route) => {
      // Delay response so we can observe the loading state
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MATCH_LIST),
      });
    });

    const home = new HomePage(page);
    await home.goto();

    // Loading spinner should appear immediately while the request is in flight
    await expect(home.loadingSpinner).toBeVisible();

    // Eventually the spinner disappears and cards render
    await expect(home.loadingSpinner).not.toBeVisible({ timeout: 5000 });
    await expect(home.matchCards).toHaveCount(MATCH_LIST.length);
  });

  test('should show error state when the matches API returns 500', async ({ page }) => {
    await page.route('**/api/matches', (route) => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    const home = new HomePage(page);
    await home.goto();

    await expect(home.errorMessage).toBeVisible();
    // Loading and match cards must not be visible
    await expect(home.loadingSpinner).not.toBeVisible();
    await expect(home.matchCards).toHaveCount(0);
  });

  test('should show empty state when the API returns an empty list', async ({ page }) => {
    await page.route('**/api/matches', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    const home = new HomePage(page);
    await home.goto();

    await expect(home.emptyState).toBeVisible();
    await expect(home.emptyState).toContainText('Jelenleg nincs meghirdetett mérkőzés');
    await expect(home.matchCards).toHaveCount(0);
  });

  test('should show placeholder countdown when upcoming returns empty list', async ({ page }) => {
    await page.route('**/api/matches/upcoming', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    const home = new HomePage(page);
    await home.goto();

    // When there is no upcoming match, the placeholder mat-card renders
    await expect(page.locator('.kte-countdown--empty')).toBeVisible();
    // Main countdown grid must not be visible
    await expect(home.countdownGrid).not.toBeVisible();
  });

  test('should render competition label NB I for NB1 matches', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    const firstCard = home.matchCard(0);
    await expect(firstCard.locator('.kte-match-card__competition')).toContainText('NB I');
  });

  test('should display venue information in the match card', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    const firstCard = home.matchCard(0);
    await expect(firstCard).toContainText(MATCH_LIST_ITEM_1.venue);
  });

  test('second match card shows different away team name', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    const secondCard = home.matchCard(1);
    const { away } = home.teamNamesInCard(secondCard);
    await expect(away).toContainText(MATCH_LIST_ITEM_2.awayTeam);
  });
});
