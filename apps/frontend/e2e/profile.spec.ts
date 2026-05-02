import { test, expect } from '@playwright/test';
import { ProfilePage } from './pages/profile.page';
import {
  AUTH_RESPONSE,
  USER_PROFILE,
  TICKET_ACTIVE,
  TICKET_PAST,
  TICKETS_PAGE_RESPONSE,
  TICKETS_EMPTY_RESPONSE,
} from './fixtures/api-mocks';

// Iteration 5: mock the waitlist endpoint so the new "Várólista" tab does not
// fire unmocked requests. Returns an empty list by default so existing tests
// are unaffected.
function mockWaitlistEmpty(page: import('@playwright/test').Page): Promise<void> {
  return page.route('**/waitlist/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    }),
  );
}

/**
 * E2E tests for the User Profile page (/profile) – EPIC E5.
 *
 * All API calls are mocked. The authGuard protecting /profile is exercised
 * indirectly: a valid auth/refresh response makes the user appear authenticated.
 *
 * Updated for Iteration 4 (KTE-041):
 *  - Active tickets are now rendered as kte-ticket-card components, not raw
 *    mat-card elements. The ProfilePage PO was updated accordingly.
 *  - Test 6 no longer checks for the raw QR code string inside the card body
 *    (it is now shown only inside the TicketQrDialog). It verifies instead that
 *    the "QR megtekintés" trigger button is present on each active ticket card.
 *  - Season pass and loan mock helpers are also registered in beforeEach so
 *    the page does not fire unmocked requests when the new tabs render.
 *
 * Scenarios:
 *  1. Loading spinner appears while profile data is being fetched
 *  2. Hero card shows user full name, email, and loyalty tier chip
 *  3. Avatar shows correct initials
 *  4. Loyalty points count is rendered
 *  5. Active tickets tab shows ticket cards
 *  6. Active ticket card shows match info, seat info, price, and QR trigger button
 *  7. Clicking the "Vásárlási előzmények" tab shows past tickets
 *  8. Empty active tickets tab shows the placeholder message
 *  9. Empty past tickets tab shows the placeholder message
 * 10. Logout button is visible and navigates to "/" on click
 */

// ---------------------------------------------------------------------------
// Helpers
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
    // Ignore the /users/me/tickets sub-path in a separate mock below
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

function mockTickets(
  page: import('@playwright/test').Page,
  response: unknown = TICKETS_PAGE_RESPONSE,
): Promise<void> {
  return page.route('**/users/me/tickets**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    }),
  );
}

function mockLogout(page: import('@playwright/test').Page): Promise<void> {
  return page.route('**/auth/logout', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
}

/**
 * Mocks the season passes endpoint so the new Iteration 4 "Season Passes"
 * section on the profile page does not trigger unmocked network requests.
 * Returns an empty list by default.
 */
function mockSeasonPasses(page: import('@playwright/test').Page): Promise<void> {
  return page.route('**/users/me/season-passes**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [], total: 0 }),
    }),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Profile Page – /profile', () => {
  test.beforeEach(async ({ page }) => {
    await mockRefreshSuccess(page);
    await mockMe(page);
    await mockTickets(page);
    await mockLogout(page);
    // Iteration 4: prevent unmocked requests for new sections
    await mockSeasonPasses(page);
    // Iteration 5: prevent unmocked requests for the new Várólista tab
    await mockWaitlistEmpty(page);
  });

  test('should show a loading spinner while profile data is being fetched', async ({ page }) => {
    // Delay the /users/me response so the spinner is visible
    await page.route('**/users/me', async (route) => {
      if (!route.request().url().includes('/tickets')) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(USER_PROFILE),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await expect(profile.loader).toBeVisible();
  });

  test('should render the hero card with full name, email, and loyalty chip', async ({ page }) => {
    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await expect(profile.heroCard).toBeVisible();
    // Full name: lastName + firstName
    await expect(profile.fullName).toContainText(USER_PROFILE.lastName);
    await expect(profile.fullName).toContainText(USER_PROFILE.firstName);
    // Email
    await expect(profile.email).toContainText(USER_PROFILE.email);
    // Loyalty chip — bronze tier → "Bronz"
    await expect(profile.loyaltyChip).toContainText('Bronz');
  });

  test('should display the correct avatar initials', async ({ page }) => {
    await page.goto('/profile');
    const profile = new ProfilePage(page);

    // Expected: lastName[0].toUpperCase() + firstName[0].toUpperCase()
    const expected =
      (USER_PROFILE.lastName[0] ?? '').toUpperCase() +
      (USER_PROFILE.firstName[0] ?? '').toUpperCase();

    await expect(profile.avatarInitials).toContainText(expected);
  });

  test('should display the loyalty points count', async ({ page }) => {
    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await expect(profile.loyaltyPoints).toContainText(String(USER_PROFILE.loyaltyPoints));
  });

  test('should render active ticket cards in the active tickets tab', async ({ page }) => {
    await page.goto('/profile');
    const profile = new ProfilePage(page);

    // The active tickets tab is selected by default
    await expect(profile.activeTicketCards).toHaveCount(1); // Only TICKET_ACTIVE is isActive: true
  });

  test('should show match info, seat info, and QR trigger button inside the active ticket card', async ({
    page,
  }) => {
    await page.goto('/profile');
    const profile = new ProfilePage(page);

    const card = profile.activeTicketCards.first();
    // Match header
    await expect(card).toContainText(TICKET_ACTIVE.homeTeam);
    await expect(card).toContainText(TICKET_ACTIVE.awayTeam);
    // Seat info
    await expect(card).toContainText(TICKET_ACTIVE.section);
    await expect(card).toContainText(TICKET_ACTIVE.row);
    await expect(card).toContainText(String(TICKET_ACTIVE.seatNumber));
    // KTE-041: the QR code string is no longer rendered directly in the card
    // body — it is only shown inside the TicketQrDialogComponent. What we
    // assert here is the presence of the dialog-trigger button so the QR is
    // accessible but the raw token is not leaked into the DOM.
    await expect(profile.qrButtonInCard(0)).toBeVisible();
  });

  test('should show past ticket cards after switching to the history tab', async ({ page }) => {
    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await profile.pastTicketsTab.click();

    await expect(profile.pastTicketCards).toHaveCount(1);

    const pastCard = profile.pastTicketCards.first();
    await expect(pastCard).toContainText(TICKET_PAST.homeTeam);
    await expect(pastCard).toContainText(TICKET_PAST.awayTeam);
  });

  test('should show the empty-state message when there are no active tickets', async ({
    page,
  }) => {
    // Override the tickets mock with an empty response
    await mockTickets(page, TICKETS_EMPTY_RESPONSE);

    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await expect(profile.activeTicketsEmpty).toBeVisible();
    await expect(profile.activeTicketsEmpty).toContainText('Még nincs aktív jegyed');
  });

  test('should show the empty-state message in the history tab when there are no past tickets', async ({
    page,
  }) => {
    await mockTickets(page, TICKETS_EMPTY_RESPONSE);

    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await profile.pastTicketsTab.click();

    await expect(profile.pastTicketsEmpty).toBeVisible();
    await expect(profile.pastTicketsEmpty).toContainText('Még nincs lezárult');
  });

  test('should navigate to "/" after clicking the logout button', async ({ page }) => {
    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await expect(profile.logoutButton).toBeVisible();
    await profile.logoutButton.click();

    // AuthService.logout() calls router.navigate(['/']) after clearing state
    await expect(page).toHaveURL('/');
  });
});
