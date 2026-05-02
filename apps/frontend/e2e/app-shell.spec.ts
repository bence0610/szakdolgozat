import { test, expect } from '@playwright/test';
import { AppShellPage } from './pages/app-shell.page';
import { CartPage } from './pages/cart.page';
import { MATCH_ID_1, SEAT_ID_AVAILABLE, OWNER_TOKEN, AUTH_RESPONSE } from './fixtures/api-mocks';

/**
 * E2E tests for the App Shell (toolbar, sidenav) – Iteration 3 additions.
 *
 * Iteration 3 introduced:
 *  - Cart badge (MatBadge) on the cart icon button in the toolbar
 *  - User menu (mat-menu) with "Profil" and "Kijelentkezés" items when authenticated
 *  - "Bejelentkezés" stroked-button when unauthenticated
 *  - Hamburger sidenav with auth-conditional links
 *
 * Scenarios:
 *  1. Unauthenticated: "Bejelentkezés" button visible, user menu hidden
 *  2. Unauthenticated: cart icon is visible with no badge
 *  3. Authenticated: user menu button visible, "Bejelentkezés" button hidden
 *  4. Authenticated: toolbar shows user initials
 *  5. Cart badge appears and shows "1" when one item is in the cart
 *  6. Cart badge updates to "2" when two items are in the cart
 *  7. User menu opens and contains "Profil" and "Kijelentkezés" items
 *  8. Clicking "Kijelentkezés" from the user menu logs out and redirects to "/"
 *  9. Sidenav opens on hamburger click and closes on item click
 * 10. Sidenav shows "Bejelentkezés" link when unauthenticated
 * 11. Sidenav shows "Profil" link when authenticated
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockRefreshFail(page: import('@playwright/test').Page): Promise<void> {
  return page.route('**/auth/refresh', (route) =>
    route.fulfill({ status: 401, body: 'Unauthorized' }),
  );
}

function mockRefreshSuccess(page: import('@playwright/test').Page): Promise<void> {
  return page.route('**/auth/refresh', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(AUTH_RESPONSE),
    }),
  );
}

function mockLogout(page: import('@playwright/test').Page): Promise<void> {
  return page.route('**/auth/logout', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
}

function mockMatchesEmpty(page: import('@playwright/test').Page): Promise<void> {
  return page.route('**/api/matches**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
}

// ---------------------------------------------------------------------------
// Unauthenticated state
// ---------------------------------------------------------------------------

test.describe('App Shell – unauthenticated', () => {
  test.beforeEach(async ({ page }) => {
    await mockRefreshFail(page);
    await mockMatchesEmpty(page);
  });

  test('should show the Bejelentkezés button and hide the user menu', async ({ page }) => {
    const shell = new AppShellPage(page);
    await page.goto('/');

    await expect(shell.loginButton).toBeVisible();
    await expect(shell.userMenuButton).not.toBeVisible();
  });

  test('should show the cart icon button with no badge when the cart is empty', async ({
    page,
  }) => {
    await page.goto('/');
    const shell = new AppShellPage(page);

    await expect(shell.cartIconButton).toBeVisible();
    expect(await shell.getCartCount()).toBeNull();
  });

  test('should show Bejelentkezés in the sidenav when unauthenticated', async ({ page }) => {
    await page.goto('/');
    const shell = new AppShellPage(page);

    await shell.hamburgerButton.click();
    await expect(shell.sidenav).toBeVisible();
    await expect(shell.sidenav.getByRole('link', { name: /bejelentkezés/i })).toBeVisible();
    await expect(shell.sidenav.getByRole('link', { name: /profil/i })).not.toBeVisible();
  });

  test('should close the sidenav when a nav item is clicked', async ({ page }) => {
    await page.goto('/');
    const shell = new AppShellPage(page);

    await shell.hamburgerButton.click();
    await expect(shell.sidenav).toBeVisible();

    // Click any nav link to close the sidenav
    await shell.sidenav.getByRole('link', { name: /kezdőlap/i }).click();
    await expect(shell.sidenav).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Authenticated state
// ---------------------------------------------------------------------------

test.describe('App Shell – authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await mockRefreshSuccess(page);
    await mockMatchesEmpty(page);
  });

  test('should show the user menu button and hide the Bejelentkezés button', async ({ page }) => {
    const shell = new AppShellPage(page);
    await page.goto('/');

    await expect(shell.userMenuButton).toBeVisible();
    await expect(shell.loginButton).not.toBeVisible();
  });

  test('should display the correct user initials in the toolbar', async ({ page }) => {
    const shell = new AppShellPage(page);
    await page.goto('/');

    // AUTH_RESPONSE.user = { lastName: 'Felhasználó', firstName: 'Teszt' }
    const expectedInitials = 'FT';
    await expect(page.locator('.kte-shell__avatar')).toContainText(expectedInitials);
  });

  test('should open the user menu with Profil and Kijelentkezés items', async ({ page }) => {
    const shell = new AppShellPage(page);
    await page.goto('/');

    await shell.openUserMenu();

    await expect(shell.userMenuProfileLink).toBeVisible();
    await expect(shell.logoutMenuButton).toBeVisible();
  });

  test('should logout and redirect to "/" when Kijelentkezés is clicked', async ({ page }) => {
    await mockLogout(page);

    const shell = new AppShellPage(page);
    await page.goto('/');

    await shell.logout();

    await expect(page).toHaveURL('/');
    // After logout the "Bejelentkezés" button reappears
    await expect(shell.loginButton).toBeVisible({ timeout: 5000 });
  });

  test('should show the Profil link in the sidenav when authenticated', async ({ page }) => {
    const shell = new AppShellPage(page);
    await page.goto('/');

    await shell.hamburgerButton.click();
    await expect(shell.sidenav).toBeVisible();
    await expect(shell.sidenav.getByRole('link', { name: /profil/i })).toBeVisible();
    await expect(shell.sidenav.getByRole('link', { name: /bejelentkezés/i })).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Cart badge
// ---------------------------------------------------------------------------

test.describe('App Shell – cart badge', () => {
  test.beforeEach(async ({ page }) => {
    await mockRefreshFail(page);
    await mockMatchesEmpty(page);
  });

  test('should show badge count of 1 when one item is in the cart', async ({ page }) => {
    await CartPage.seedSessionCart(
      page,
      [
        {
          seatId: SEAT_ID_AVAILABLE,
          matchId: MATCH_ID_1,
          ownerToken: OWNER_TOKEN,
          lockExpiresAtMs: Date.now() + 280_000,
        },
      ],
      MATCH_ID_1,
    );

    await page.goto('/');
    const shell = new AppShellPage(page);

    const count = await shell.getCartCount();
    expect(count).toBe(1);
  });

  test('should show badge count of 2 when two items are in the cart', async ({ page }) => {
    await CartPage.seedSessionCart(
      page,
      [
        {
          seatId: `${SEAT_ID_AVAILABLE}-1`,
          matchId: MATCH_ID_1,
          ownerToken: OWNER_TOKEN,
          lockExpiresAtMs: Date.now() + 280_000,
        },
        {
          seatId: `${SEAT_ID_AVAILABLE}-2`,
          matchId: MATCH_ID_1,
          ownerToken: OWNER_TOKEN,
          lockExpiresAtMs: Date.now() + 280_000,
        },
      ],
      MATCH_ID_1,
    );

    await page.goto('/');
    const shell = new AppShellPage(page);

    const count = await shell.getCartCount();
    expect(count).toBe(2);
  });

  test('should navigate to /cart when the cart icon button is clicked', async ({ page }) => {
    const shell = new AppShellPage(page);
    await page.goto('/');

    await shell.cartIconButton.click();

    await expect(page).toHaveURL('/cart');
  });
});
