import { test, expect } from '@playwright/test';
import { ProfilePage } from './pages/profile.page';
import {
  AUTH_RESPONSE,
  USER_PROFILE,
  TICKETS_PAGE_RESPONSE,
  MATCH_LIST,
  MATCH_ID_1,
  MATCH_LIST_ITEM_1,
  SEASON_PASS_ID,
  SEASON_PASS_ACTIVE,
  SEASON_PASSES_RESPONSE,
  LOAN_CREATE_RESPONSE,
  LOAN_ACTIVE,
  ACTIVE_LOANS_RESPONSE,
  LOAN_ID,
  LOAN_CANCEL_RESPONSE,
} from './fixtures/api-mocks';

/**
 * E2E tests for the Pass Loan Initiation UI – KTE-051 and KTE-054.
 *
 * The loan flow is a 4-step modal dialog accessible from the profile page's
 * season passes section. All API calls are mocked.
 *
 * KTE-051 – Loan Initiation (Steps 1–4):
 *  1.  "Kölcsön adás" button opens the loan dialog
 *  2.  Step 1: match list renders, already-loaned matches are disabled
 *  3.  Step 1: selecting a match enables the "Következő" button
 *  4.  Step 2: invalid email format shows an error and keeps Next disabled
 *  5.  Step 2: valid email enables the "Következő" button
 *  6.  Step 3: summary shows the selected match name and recipient email
 *  7.  Step 3: API error on confirm renders an error banner
 *  8.  Step 4 (success): success state is shown with a QR block
 *  9.  "Mégsem" button on step 1 closes the dialog without submitting
 * 10.  "Mégsem" button on step 2 closes the dialog
 * 11.  "Bezárás" on step 4 closes the dialog
 *
 * KTE-054 – Loan Cancellation:
 * 12.  Active loans are listed with a "Lemondás" button
 * 13.  Clicking "Lemondás" calls DELETE and removes the loan from the list
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
    const url = route.request().url();
    if (!url.includes('/tickets') && !url.includes('/season-passes')) {
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

function mockSeasonPasses(
  page: import('@playwright/test').Page,
  body: unknown = SEASON_PASSES_RESPONSE,
): Promise<void> {
  return page.route('**/users/me/season-passes**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    }),
  );
}

/**
 * GET /api/matches — returns the standard match list for the loan dialog's
 * match selection step. One match is already loaned (MATCH_ID_1 is occupied
 * by LOAN_ACTIVE) to test that it renders as disabled.
 */
function mockMatchesForLoan(page: import('@playwright/test').Page): Promise<void> {
  return page.route('**/api/matches**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MATCH_LIST),
    }),
  );
}

/**
 * Mock POST /api/season-passes/:id/loans to return a successful loan creation.
 */
function mockLoanCreate(page: import('@playwright/test').Page): Promise<void> {
  return page.route(`**/season-passes/${SEASON_PASS_ID}/loans`, (route) => {
    if (route.request().method() === 'POST') {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(LOAN_CREATE_RESPONSE),
      });
    } else {
      route.continue();
    }
  });
}

/**
 * Mock POST /api/season-passes/:id/loans to return a 500 error — used to
 * test the error banner on step 3.
 */
function mockLoanCreateFail(page: import('@playwright/test').Page): Promise<void> {
  return page.route(`**/season-passes/${SEASON_PASS_ID}/loans`, (route) => {
    if (route.request().method() === 'POST') {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ statusCode: 500, message: 'Internal Server Error' }),
      });
    } else {
      route.continue();
    }
  });
}

/**
 * Mock GET active loans so the KTE-054 section shows at least one loan with a
 * cancel button.
 */
function mockActiveLoans(
  page: import('@playwright/test').Page,
  body: unknown = ACTIVE_LOANS_RESPONSE,
): Promise<void> {
  return page.route(`**/season-passes/${SEASON_PASS_ID}/loans**`, (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    } else {
      route.continue();
    }
  });
}

/**
 * Mock DELETE /api/season-passes/:id/loans/:loanId for successful cancellation.
 */
function mockLoanCancel(page: import('@playwright/test').Page): Promise<void> {
  return page.route(`**/season-passes/${SEASON_PASS_ID}/loans/${LOAN_ID}`, (route) => {
    if (route.request().method() === 'DELETE') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(LOAN_CANCEL_RESPONSE),
      });
    } else {
      route.continue();
    }
  });
}

// ---------------------------------------------------------------------------
// Shared setup
// ---------------------------------------------------------------------------

async function setupAuthenticatedProfile(page: import('@playwright/test').Page): Promise<void> {
  await mockRefreshSuccess(page);
  await mockMe(page);
  await mockTickets(page);
}

// ---------------------------------------------------------------------------
// KTE-051 — Loan Initiation Dialog
// ---------------------------------------------------------------------------

test.describe('Loan Initiation Dialog (KTE-051)', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedProfile(page);
    await mockSeasonPasses(page);
    await mockMatchesForLoan(page);
    await mockLoanCreate(page);
  });

  test('should open the loan dialog when "Kölcsön adás" is clicked', async ({ page }) => {
    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await expect(profile.loanInitiateButton).toBeVisible({ timeout: 8000 });
    await profile.loanInitiateButton.click();

    await expect(profile.loanDialog).toBeVisible({ timeout: 5000 });
  });

  test('should render the match list on step 1', async ({ page }) => {
    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await profile.loanInitiateButton.click();
    await expect(profile.loanDialog).toBeVisible({ timeout: 5000 });

    await expect(profile.loanMatchList).toBeVisible();
    // MATCH_LIST has 2 matches
    const matchItems = profile.loanMatchList.locator('[data-testid="loan-match-item"]');
    await expect(matchItems).toHaveCount(2);
  });

  test('should disable already-loaned match items on step 1', async ({ page }) => {
    // Seed an active loan so MATCH_ID_1 is already occupied
    await mockActiveLoans(page);

    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await profile.loanInitiateButton.click();
    await expect(profile.loanDialog).toBeVisible({ timeout: 5000 });

    // The match item that is already loaned must be disabled (aria-disabled or :disabled)
    const disabledItem = profile.loanMatchList.locator(
      `[data-testid="loan-match-item"][data-match-id="${MATCH_ID_1}"]`,
    );
    await expect(disabledItem).toHaveAttribute('aria-disabled', 'true');
  });

  test('should advance to step 2 after selecting a match and clicking Következő', async ({
    page,
  }) => {
    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await profile.loanInitiateButton.click();
    await expect(profile.loanDialog).toBeVisible({ timeout: 5000 });

    // Select the first match item
    const firstMatch = profile.loanMatchList.locator('[data-testid="loan-match-item"]').first();
    await firstMatch.click();

    await profile.loanStep1Next.click();

    await expect(profile.loanStep2).toBeVisible();
  });

  test('should show an email validation error for an invalid email on step 2', async ({
    page,
  }) => {
    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await profile.loanInitiateButton.click();
    await expect(profile.loanDialog).toBeVisible({ timeout: 5000 });

    // Navigate to step 2
    await profile.loanMatchList.locator('[data-testid="loan-match-item"]').first().click();
    await profile.loanStep1Next.click();
    await expect(profile.loanStep2).toBeVisible();

    // Type an invalid email and blur the field
    await profile.loanEmailInput.fill('not-an-email');
    await profile.loanEmailInput.blur();

    await expect(profile.loanEmailError).toBeVisible();
    await expect(profile.loanEmailError).toContainText(/érvényes email/i);
    // The Next button must remain disabled
    await expect(profile.loanStep2Next).toBeDisabled();
  });

  test('should enable the Következő button on step 2 when a valid email is entered', async ({
    page,
  }) => {
    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await profile.loanInitiateButton.click();
    await expect(profile.loanDialog).toBeVisible({ timeout: 5000 });

    await profile.loanMatchList.locator('[data-testid="loan-match-item"]').first().click();
    await profile.loanStep1Next.click();
    await expect(profile.loanStep2).toBeVisible();

    await profile.loanEmailInput.fill('recipient@example.com');
    await profile.loanEmailInput.blur();

    await expect(profile.loanStep2Next).toBeEnabled({ timeout: 3000 });
  });

  test('should show a summary on step 3 with the selected match name and email', async ({
    page,
  }) => {
    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await profile.loanInitiateButton.click();
    await expect(profile.loanDialog).toBeVisible({ timeout: 5000 });

    // Step 1
    await profile.loanMatchList.locator('[data-testid="loan-match-item"]').first().click();
    await profile.loanStep1Next.click();

    // Step 2
    await profile.loanEmailInput.fill('recipient@example.com');
    await profile.loanStep2Next.click();

    // Step 3 — summary
    await expect(profile.loanStep3).toBeVisible();
    await expect(profile.loanSummaryMatchName).toContainText(MATCH_LIST_ITEM_1.homeTeam);
    await expect(profile.loanSummaryMatchName).toContainText(MATCH_LIST_ITEM_1.awayTeam);
    await expect(profile.loanSummaryEmail).toContainText('recipient@example.com');
  });

  test('should show an error banner on step 3 when the API call fails', async ({ page }) => {
    // Override the loan create mock with a failure response
    await mockLoanCreateFail(page);

    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await profile.loanInitiateButton.click();
    await expect(profile.loanDialog).toBeVisible({ timeout: 5000 });

    // Navigate through steps 1 and 2
    await profile.loanMatchList.locator('[data-testid="loan-match-item"]').first().click();
    await profile.loanStep1Next.click();
    await profile.loanEmailInput.fill('recipient@example.com');
    await profile.loanStep2Next.click();
    await expect(profile.loanStep3).toBeVisible();

    // Confirm on step 3 — the API will return 500
    await profile.loanStep3Confirm.click();

    await expect(profile.loanStep3ErrorBanner).toBeVisible({ timeout: 5000 });
    await expect(profile.loanStep3ErrorBanner).toContainText(/hiba|sikertelen/i);
  });

  test('should show the success state with a QR block on step 4', async ({ page }) => {
    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await profile.loanInitiateButton.click();
    await expect(profile.loanDialog).toBeVisible({ timeout: 5000 });

    await profile.loanMatchList.locator('[data-testid="loan-match-item"]').first().click();
    await profile.loanStep1Next.click();
    await profile.loanEmailInput.fill('recipient@example.com');
    await profile.loanStep2Next.click();
    await expect(profile.loanStep3).toBeVisible();
    await profile.loanStep3Confirm.click();

    // Step 4 — success
    await expect(profile.loanStep4).toBeVisible({ timeout: 5000 });
    await expect(profile.loanSuccessQr).toBeVisible();
  });

  test('should close the dialog when "Mégsem" is clicked on step 1', async ({ page }) => {
    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await profile.loanInitiateButton.click();
    await expect(profile.loanDialog).toBeVisible({ timeout: 5000 });

    await profile.loanCancelButton.click();

    await expect(profile.loanDialog).not.toBeVisible({ timeout: 3000 });
  });

  test('should close the dialog when "Mégsem" is clicked on step 2', async ({ page }) => {
    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await profile.loanInitiateButton.click();
    await expect(profile.loanDialog).toBeVisible({ timeout: 5000 });

    // Advance to step 2
    await profile.loanMatchList.locator('[data-testid="loan-match-item"]').first().click();
    await profile.loanStep1Next.click();
    await expect(profile.loanStep2).toBeVisible();

    await profile.loanCancelButton.click();

    await expect(profile.loanDialog).not.toBeVisible({ timeout: 3000 });
  });

  test('should close the dialog when "Bezárás" is clicked on step 4', async ({ page }) => {
    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await profile.loanInitiateButton.click();
    await expect(profile.loanDialog).toBeVisible({ timeout: 5000 });

    // Complete the full flow
    await profile.loanMatchList.locator('[data-testid="loan-match-item"]').first().click();
    await profile.loanStep1Next.click();
    await profile.loanEmailInput.fill('recipient@example.com');
    await profile.loanStep2Next.click();
    await expect(profile.loanStep3).toBeVisible();
    await profile.loanStep3Confirm.click();
    await expect(profile.loanStep4).toBeVisible({ timeout: 5000 });

    await profile.loanStep4Close.click();

    await expect(profile.loanDialog).not.toBeVisible({ timeout: 3000 });
  });
});

// ---------------------------------------------------------------------------
// KTE-054 — Loan Cancellation Flow
// ---------------------------------------------------------------------------

test.describe('Loan Cancellation (KTE-054)', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedProfile(page);
    await mockSeasonPasses(page);
    await mockMatchesForLoan(page);
    await mockActiveLoans(page);
    await mockLoanCancel(page);
  });

  test('should render the active loan list with a "Lemondás" button per loan', async ({ page }) => {
    await page.goto('/profile');
    const profile = new ProfilePage(page);

    // The active loans section must be visible with at least one loan card
    await expect(profile.activeLoans).toBeVisible({ timeout: 8000 });
    // ACTIVE_LOANS_RESPONSE has 1 loan
    await expect(profile.loanCancelItemButton).toBeVisible();
  });

  test('should remove the loan from the list after a successful cancellation', async ({ page }) => {
    // After cancel, the list is refreshed — seed an empty response for the
    // subsequent GET call so the loan disappears from the UI.
    let cancelCalled = false;
    await page.route(`**/season-passes/${SEASON_PASS_ID}/loans/${LOAN_ID}`, async (route) => {
      if (route.request().method() === 'DELETE') {
        cancelCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(LOAN_CANCEL_RESPONSE),
        });
      } else {
        await route.continue();
      }
    });

    // After the cancel call, return an empty list on the next GET /loans
    await page.route(`**/season-passes/${SEASON_PASS_ID}/loans**`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: cancelCalled
            ? JSON.stringify({ items: [], total: 0 })
            : JSON.stringify(ACTIVE_LOANS_RESPONSE),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await expect(profile.loanCancelItemButton).toBeVisible({ timeout: 8000 });
    await profile.loanCancelItemButton.click();

    // After cancellation the loan row must disappear
    await expect(profile.loanCancelItemButton).not.toBeVisible({ timeout: 5000 });
  });

  test('should show a confirmation prompt before cancelling the loan', async ({ page }) => {
    await page.goto('/profile');
    const profile = new ProfilePage(page);

    await expect(profile.loanCancelItemButton).toBeVisible({ timeout: 8000 });
    await profile.loanCancelItemButton.click();

    // A confirmation dialog or snackbar must appear before the DELETE fires
    const confirmation = page.locator(
      '[data-testid="loan-cancel-confirm"], mat-dialog-container, mat-snack-bar-container',
    );
    await expect(confirmation).toBeVisible({ timeout: 3000 });
  });
});
