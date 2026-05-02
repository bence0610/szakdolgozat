import { test, expect } from '@playwright/test';
import { ProfilePage } from './pages/profile.page';
import { StadiumPage } from './pages/stadium.page';
import {
  AUTH_RESPONSE,
  USER_PROFILE,
  TICKETS_PAGE_RESPONSE,
  MATCH_ID_1,
  MATCH_LIST,
  MATCH_SEATS_RESPONSE,
  WAITLIST_ENTRY_ACTIVE,
  WAITLIST_ENTRY_LIST_ACTIVE,
  WAITLIST_ENTRY_LIST_NOTIFIED,
  WAITLIST_ENTRY_LIST_EMPTY,
  WAITLIST_JOIN_RESPONSE,
} from './fixtures/api-mocks';

/**
 * E2E tests for the Waitlist feature – KTE-057 (Iteration 5).
 *
 * All API calls are mocked. Two surfaces are exercised:
 *  A) Profile page (/profile) – "Várólista" tab
 *  B) Stadium page (/stadium) – "Várólistára iratkozom" button on a sold-out match
 *
 * Scenarios:
 *  Profile – Várólista tab:
 *   1. "Várólista" tab is visible on the profile page
 *   2. Tab shows empty state when user has no waitlist entries
 *   3. Active waitlist card shows match title and position text
 *   4. NOTIFIED status card shows the "Megerősítés és vásárlás" CTA
 *   5. NOTIFIED status card shows a progress bar countdown
 *
 *  Stadium – waitlist join button:
 *   6. Waitlist join button is visible when all seats are sold out
 *   7. Clicking "Várólistára iratkozom" while authenticated fires POST /waitlist
 *   8. After a successful join a success snackbar appears
 */

// ---------------------------------------------------------------------------
// Helper mocks — profile surface
// ---------------------------------------------------------------------------

function mockRefreshSuccess(page: import('@playwright/test').Page): Promise<void> {
  return page.route('**/auth/refresh', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(AUTH_RESPONSE),
    }),
  );
}

function mockMe(page: import('@playwright/test').Page): Promise<void> {
  return page.route('**/users/me', (route) => {
    if (!route.request().url().includes('/tickets')) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(USER_PROFILE),
      });
    } else {
      route.continue();
    }
  });
}

function mockTickets(page: import('@playwright/test').Page): Promise<void> {
  return page.route('**/users/me/tickets**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(TICKETS_PAGE_RESPONSE),
    }),
  );
}

function mockSeasonPasses(page: import('@playwright/test').Page): Promise<void> {
  return page.route('**/users/me/season-passes**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [], total: 0 }),
    }),
  );
}

function mockLogout(page: import('@playwright/test').Page): Promise<void> {
  return page.route('**/auth/logout', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
}

function mockWaitlist(
  page: import('@playwright/test').Page,
  entries: unknown = WAITLIST_ENTRY_LIST_EMPTY,
): Promise<void> {
  return page.route('**/waitlist/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(entries),
    }),
  );
}

// ---------------------------------------------------------------------------
// Helper mocks — stadium surface
// ---------------------------------------------------------------------------

function mockMatches(page: import('@playwright/test').Page): Promise<void> {
  return page.route('**/api/matches', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MATCH_LIST),
    }),
  );
}

/**
 * Returns a match list where MATCH_ID_1 has availableSeats = 0 so the
 * stadium page renders the "Telt ház" banner with the waitlist join button.
 * The isSoldOut() guard checks: match.status === 'sold_out' || availableSeats <= 0.
 */
function makeSoldOutMatchList(): unknown[] {
  return [
    { ...MATCH_LIST[0], availableSeats: 0 },
    MATCH_LIST[1],
  ];
}

function mockSoldOutMatches(page: import('@playwright/test').Page): Promise<void> {
  return page.route('**/api/matches', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeSoldOutMatchList()),
    }),
  );
}

function mockWaitlistJoin(page: import('@playwright/test').Page): Promise<void> {
  return page.route('**/waitlist', (route) => {
    if (route.request().method() === 'POST') {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(WAITLIST_JOIN_RESPONSE),
      });
    } else {
      route.continue();
    }
  });
}

// ---------------------------------------------------------------------------
// Profile page tests — "Várólista" tab
// ---------------------------------------------------------------------------

test.describe('Waitlist – Profile Page /profile', () => {
  test.beforeEach(async ({ page }) => {
    await mockRefreshSuccess(page);
    await mockMe(page);
    await mockTickets(page);
    await mockSeasonPasses(page);
    await mockLogout(page);
  });

  test('should show the "Várólista" tab on the profile page', async ({ page }) => {
    await mockWaitlist(page, WAITLIST_ENTRY_LIST_EMPTY);

    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await expect(profile.waitlistTab).toBeVisible();
  });

  test('should show empty state when the user has no waitlist entries', async ({ page }) => {
    await mockWaitlist(page, WAITLIST_ENTRY_LIST_EMPTY);

    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await profile.waitlistTab.click();

    // When the tab panel renders, the waitlist list container is absent and
    // the profile empty message appears with the appropriate text.
    await expect(
      page.locator('.kte-profile__empty', { hasText: /nem vagy egyetlen várólistán sem/i }),
    ).toBeVisible();
  });

  test('should render a waitlist card with match title and position for an ACTIVE entry', async ({
    page,
  }) => {
    await mockWaitlist(page, WAITLIST_ENTRY_LIST_ACTIVE);

    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await profile.waitlistTab.click();

    // The card should be visible
    await expect(profile.waitlistCards).toHaveCount(1);

    const card = profile.waitlistCards.first();
    // Match title: "homeTeam – awayTeam"
    await expect(card).toContainText(WAITLIST_ENTRY_ACTIVE.match?.homeTeam ?? '');
    await expect(card).toContainText(WAITLIST_ENTRY_ACTIVE.match?.awayTeam ?? '');

    // Position text from the template: "3. pozíció · 2 ember vár előtted"
    await expect(profile.waitlistPositionText).toContainText(
      `${WAITLIST_ENTRY_ACTIVE.position}. pozíció`,
    );
    await expect(profile.waitlistPositionText).toContainText(
      `${WAITLIST_ENTRY_ACTIVE.peopleAhead} ember`,
    );
  });

  test('should show the "Megerősítés és vásárlás" CTA when entry is in NOTIFIED status', async ({
    page,
  }) => {
    await mockWaitlist(page, WAITLIST_ENTRY_LIST_NOTIFIED);

    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await profile.waitlistTab.click();

    await expect(profile.waitlistCards).toHaveCount(1);

    // CTA button exclusive to NOTIFIED status
    await expect(profile.waitlistConfirmButton).toBeVisible();

    // The card should also display the "Felszabadult egy hely!" chip text
    await expect(profile.waitlistCards.first()).toContainText('Felszabadult egy hely');
  });

  test('should display a progress bar in a NOTIFIED card', async ({ page }) => {
    await mockWaitlist(page, WAITLIST_ENTRY_LIST_NOTIFIED);

    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await profile.waitlistTab.click();

    // The WaitlistCardComponent renders a mat-progress-bar only when
    // both claimExpiresAt and notifiedAt are set (NOTIFIED status).
    await expect(profile.waitlistProgressBar).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Stadium page tests — waitlist join button
// ---------------------------------------------------------------------------

test.describe('Waitlist – Stadium Page /stadium', () => {
  test.beforeEach(async ({ page }) => {
    // The waitlist join button requires authenticated state so the guard
    // inside WaitlistJoinButtonComponent lets the request proceed.
    await mockRefreshSuccess(page);
  });

  test('should display the waitlist join button when the match is sold out', async ({ page }) => {
    // Provide a match list where MATCH_ID_1 has availableSeats = 0.
    // The stadium page calls isSoldOut() → availableSeats <= 0 → shows the banner.
    await mockSoldOutMatches(page);

    const stadium = new StadiumPage(page);
    await stadium.goto(MATCH_ID_1);

    // The "Telt ház!" banner with the waitlist button is rendered immediately
    // after the match is loaded — no sector click required.
    await expect(stadium.waitlistJoinButton).toBeVisible({ timeout: 5000 });
  });

  test('should call POST /waitlist after clicking the join button and show snackbar', async ({
    page,
  }) => {
    await mockSoldOutMatches(page);

    // Track the outgoing waitlist POST request
    let waitlistRequestBody: Record<string, unknown> | null = null;
    await page.route('**/waitlist', async (route) => {
      if (route.request().method() === 'POST') {
        waitlistRequestBody = JSON.parse(route.request().postData() ?? '{}') as Record<string, unknown>;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(WAITLIST_JOIN_RESPONSE),
        });
      } else {
        await route.continue();
      }
    });

    const stadium = new StadiumPage(page);
    await stadium.goto(MATCH_ID_1);

    await expect(stadium.waitlistJoinButton).toBeVisible({ timeout: 5000 });
    await stadium.waitlistJoinButton.click();

    // Verify the snackbar appeared and the API was called with the correct matchId
    await expect(stadium.snackbar).toBeVisible({ timeout: 5000 });
    expect(waitlistRequestBody?.matchId).toBe(MATCH_ID_1);
  });

  test('should show a snackbar success message after joining the waitlist', async ({ page }) => {
    await mockSoldOutMatches(page);
    await mockWaitlistJoin(page);

    const stadium = new StadiumPage(page);
    await stadium.goto(MATCH_ID_1);

    await expect(stadium.waitlistJoinButton).toBeVisible({ timeout: 5000 });
    await stadium.waitlistJoinButton.click();

    // The success snackbar text: "Sikeresen feliratkoztál a várólistára (N. pozíció)."
    await expect(stadium.snackbar).toBeVisible({ timeout: 5000 });
    await expect(stadium.snackbar).toContainText(/sikeresen feliratkoztál/i);
  });

  test('should NOT display the waitlist button when the match has available seats', async ({
    page,
  }) => {
    // Normal match list — MATCH_LIST_ITEM_1.availableSeats = 6100
    await mockMatches(page);

    // Seats endpoint is needed so the page can render the sector grid
    await page.route(`**/api/matches/${MATCH_ID_1}/seats`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MATCH_SEATS_RESPONSE),
      }),
    );

    const stadium = new StadiumPage(page);
    await stadium.goto(MATCH_ID_1);

    // Waitlist button must NOT be visible when seats are available
    await expect(stadium.waitlistJoinButton).not.toBeVisible();
  });
});
