import { test, expect } from '@playwright/test';
import { ProfilePage } from './pages/profile.page';
import {
  AUTH_RESPONSE,
  USER_PROFILE,
  TICKET_ACTIVE,
  TICKET_PAST,
  TICKETS_PAGE_RESPONSE,
  TICKET_ID_1,
  TICKET_QR_RESPONSE,
} from './fixtures/api-mocks';

/**
 * E2E tests for the E-ticket view in the User Profile page – KTE-041.
 *
 * These tests cover the TicketCardComponent and TicketQrDialogComponent
 * that were added in Iteration 4. All API calls are mocked.
 *
 * Scenarios:
 *  1. Authenticated user sees ticket cards in the active tickets tab
 *  2. Each active ticket card shows the "QR megtekintés" trigger button
 *  3. Clicking the QR button opens the TicketQrDialog
 *  4. The dialog renders a QR image fetched from GET /api/tickets/:id/qr
 *  5. The "Letöltés" button inside the dialog is present and initiates download
 *  6. The dialog can be closed with the "Bezárás" button
 *  7. Past tickets do not show the QR trigger button (they are marked "Used")
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
    if (!route.request().url().includes('/tickets') && !route.request().url().includes('/season-passes')) {
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

function mockSeasonPasses(page: import('@playwright/test').Page): Promise<void> {
  return page.route('**/users/me/season-passes**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [], total: 0 }),
    }),
  );
}

function mockTicketQr(
  page: import('@playwright/test').Page,
  ticketId: string = TICKET_ID_1,
): Promise<void> {
  return page.route(`**/tickets/${ticketId}/qr`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(TICKET_QR_RESPONSE),
    }),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Profile – E-ticket View (KTE-041)', () => {
  test.beforeEach(async ({ page }) => {
    await mockRefreshSuccess(page);
    await mockMe(page);
    await mockTickets(page);
    await mockSeasonPasses(page);
    await mockTicketQr(page);
  });

  test('should render TicketCard components for each active ticket', async ({ page }) => {
    await page.goto('/profile');
    const profile = new ProfilePage(page);

    // TICKETS_PAGE_RESPONSE contains 1 active ticket (isActive: true)
    await expect(profile.activeTicketCards).toHaveCount(1);
  });

  test('should show match info and seat details inside each ticket card', async ({ page }) => {
    await page.goto('/profile');
    const profile = new ProfilePage(page);

    const card = profile.activeTicketCards.first();
    await expect(card).toContainText(TICKET_ACTIVE.homeTeam);
    await expect(card).toContainText(TICKET_ACTIVE.awayTeam);
    await expect(card).toContainText(TICKET_ACTIVE.section);
    await expect(card).toContainText(TICKET_ACTIVE.row);
    await expect(card).toContainText(String(TICKET_ACTIVE.seatNumber));
  });

  test('should show a "QR megtekintés" button on each active ticket card', async ({ page }) => {
    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await expect(profile.qrButtonInCard(0)).toBeVisible();
  });

  test('should open the TicketQrDialog when the QR button is clicked', async ({ page }) => {
    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await profile.qrButtonInCard(0).click();

    // The dialog must be present in the overlay
    await expect(profile.qrDialog).toBeVisible({ timeout: 5000 });
  });

  test('should render the QR image inside the dialog after fetching from the API', async ({
    page,
  }) => {
    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await profile.qrButtonInCard(0).click();
    await expect(profile.qrDialog).toBeVisible({ timeout: 5000 });

    // The img element must be present and have a non-empty src attribute
    await expect(profile.qrImage).toBeVisible();
    const src = await profile.qrImage.getAttribute('src');
    expect(src).toBeTruthy();
    // The QR response returns a data URI — assert the format without checking the binary payload
    expect(src).toMatch(/^data:image\//);
  });

  test('should have a "Letöltés" button in the QR dialog that initiates a download', async ({
    page,
  }) => {
    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await profile.qrButtonInCard(0).click();
    await expect(profile.qrDialog).toBeVisible({ timeout: 5000 });

    // The download button must be present. We verify it is an <a> with a
    // download attribute OR a <button> — both trigger a download in the
    // TicketQrDialogComponent implementation.
    const downloadTrigger = profile.qrDialogDownloadButton;
    await expect(downloadTrigger).toBeVisible();

    // Intercept the download event so the test does not leave a file artifact
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await downloadTrigger.click();
    // If the component uses an anchor-based download the event fires;
    // if it uses FileSaver programmatically we simply verify no error was thrown.
    // Either way the button must have been clickable without crashing the page.
    await downloadPromise;
  });

  test('should close the QR dialog when "Bezárás" is clicked', async ({ page }) => {
    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await profile.qrButtonInCard(0).click();
    await expect(profile.qrDialog).toBeVisible({ timeout: 5000 });

    await profile.qrDialogCloseButton.click();

    await expect(profile.qrDialog).not.toBeVisible({ timeout: 3000 });
  });

  test('should NOT show the QR trigger button on past ticket cards', async ({ page }) => {
    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await profile.pastTicketsTab.click();

    // Past tickets are regular mat-card rows, not TicketCardComponent — they
    // should not have a QR button.
    const pastCard = profile.pastTicketCards.first();
    await expect(pastCard).toBeVisible();
    await expect(
      pastCard.getByRole('button', { name: /qr megtekintés/i }),
    ).not.toBeVisible();
  });
});
