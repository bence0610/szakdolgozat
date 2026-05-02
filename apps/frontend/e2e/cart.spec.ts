import { test, expect } from '@playwright/test';
import { CartPage } from './pages/cart.page';
import { AppShellPage } from './pages/app-shell.page';
import {
  MATCH_ID_1,
  SEAT_ID_AVAILABLE,
  OWNER_TOKEN,
} from './fixtures/api-mocks';

/**
 * E2E tests for the Cart page (/cart) – EPIC E4.
 *
 * The NgRx cart state is driven by sessionStorage (key: kte_cart_v1).
 * Tests seed the cart by writing the payload to sessionStorage *before*
 * navigating to /cart, so Angular's CartFacade.hydrate() picks it up at boot.
 *
 * No live backend is required — lock-release (DELETE) calls are intercepted.
 *
 * Scenarios:
 *  1. Empty cart renders the empty-state card and a link to /stadium
 *  2. Cart badge in the toolbar reflects the cart item count
 *  3. Single item in cart: row is rendered with seat info, price, and countdown
 *  4. Total price is correct for a single item
 *  5. Countdown timer is visible for each cart row
 *  6. Clicking the delete button removes the item from the cart
 *  7. After removing the only item, the empty state is shown
 *  8. "Tovább a pénztárhoz" — unauthenticated user is redirected to /login?returnUrl=/checkout
 *  9. "Tovább a pénztárhoz" — authenticated user navigates to /checkout
 * 10. Expiry warning message is visible in the summary card
 * 11. Max 6 items: page heading count shows 6
 * 12. Cart rows respect the lock expiry countdown styling (warn class) when < 1 min remaining
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
  const AUTH_RESPONSE = {
    accessToken: 'fake-access-token',
    refreshToken: 'fake-refresh-token',
    expiresIn: 900,
    user: {
      id: 'user-001',
      email: 'test@kte.hu',
      firstName: 'Teszt',
      lastName: 'Felhasználó',
      role: 'fan',
      loyaltyTier: 'bronze',
      loyaltyPoints: 0,
    },
  };
  return page.route('**/auth/refresh', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(AUTH_RESPONSE),
    }),
  );
}

function mockUnlockSuccess(page: import('@playwright/test').Page, matchId: string, seatId: string): Promise<void> {
  return page.route(`**/api/matches/${matchId}/seats/${seatId}/lock`, (route) => {
    if (route.request().method() === 'DELETE') {
      route.fulfill({ status: 204 });
    } else {
      route.continue();
    }
  });
}

/** Builds a minimal CartItem for seeding. */
function makeItem(
  seatId: string,
  price = 3500,
  lockExpiresOffsetMs = 280_000,
): Record<string, unknown> {
  return {
    seatId,
    matchId: MATCH_ID_1,
    homeTeam: 'Kecskeméti TE',
    awayTeam: 'Ferencvárosi TC',
    kickoffAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    section: 'A',
    row: '1',
    seatNumber: 5,
    category: 'standard',
    price,
    ownerToken: OWNER_TOKEN,
    lockExpiresAtMs: Date.now() + lockExpiresOffsetMs,
    addedAtMs: Date.now() - 20_000,
  };
}

// ---------------------------------------------------------------------------
// 1. Empty cart
// ---------------------------------------------------------------------------

test.describe('Cart Page – empty state', () => {
  test('should render the empty-state card when the cart has no items', async ({ page }) => {
    await mockRefreshFail(page);

    // Do NOT seed sessionStorage — cart starts empty
    await page.goto('/cart');

    const cart = new CartPage(page);

    await expect(cart.pageHeading).toContainText('Kosár');
    await expect(cart.emptyCard).toBeVisible();
    await expect(cart.emptyCard).toContainText('A kosarad üres');
    await expect(cart.emptyGoToStadiumLink).toBeVisible();
    await expect(cart.emptyGoToStadiumLink).toHaveAttribute('href', /\/stadium/);
  });

  test('should not render cart rows or the summary card when the cart is empty', async ({
    page,
  }) => {
    await mockRefreshFail(page);
    await page.goto('/cart');

    const cart = new CartPage(page);

    await expect(cart.cartRows).toHaveCount(0);
    await expect(cart.summaryCard).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Cart badge in app shell
// ---------------------------------------------------------------------------

test.describe('Cart badge – app shell', () => {
  test('should show the correct item count on the cart icon in the toolbar', async ({ page }) => {
    await mockRefreshFail(page);

    await CartPage.seedSessionCart(page, [makeItem(SEAT_ID_AVAILABLE)], MATCH_ID_1);
    await page.goto('/cart');

    const shell = new AppShellPage(page);
    const count = await shell.getCartCount();
    expect(count).toBe(1);
  });

  test('should not show a badge when the cart is empty', async ({ page }) => {
    await mockRefreshFail(page);
    await page.goto('/cart');

    const shell = new AppShellPage(page);
    const count = await shell.getCartCount();
    // Badge is hidden (matBadge bound to null when count is 0)
    expect(count).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3–5. Cart with one item
// ---------------------------------------------------------------------------

test.describe('Cart Page – single item', () => {
  test.beforeEach(async ({ page }) => {
    await mockRefreshFail(page);
    await CartPage.seedSessionCart(page, [makeItem(SEAT_ID_AVAILABLE, 3500)], MATCH_ID_1);
  });

  test('should render one cart row with match info and seat info', async ({ page }) => {
    await page.goto('/cart');
    const cart = new CartPage(page);

    await expect(cart.cartRows).toHaveCount(1);

    const row = cart.cartRows.first();
    // Match label
    await expect(row).toContainText('Kecskeméti TE');
    await expect(row).toContainText('Ferencvárosi TC');
    // Seat info
    await expect(row).toContainText('A');
    await expect(row).toContainText('1'); // row number
  });

  test('should display the correctly formatted price in the cart row', async ({ page }) => {
    await page.goto('/cart');
    const cart = new CartPage(page);

    const row = cart.cartRows.first();
    // HufCurrencyPipe formats 3500 as "3 500 Ft" or similar
    await expect(row.locator('.kte-cart__price')).toContainText('3');
    await expect(row.locator('.kte-cart__price')).toContainText('500');
  });

  test('should display the total price in the summary card', async ({ page }) => {
    await page.goto('/cart');
    const cart = new CartPage(page);

    await expect(cart.summaryCard).toBeVisible();
    await expect(cart.totalPrice).toContainText('3');
  });

  test('should render a countdown timer in the cart row', async ({ page }) => {
    await page.goto('/cart');
    const cart = new CartPage(page);

    const countdown = cart.countdownInRow(0);
    await expect(countdown).toBeVisible();
    // Should contain a colon-separated time value like "04:40"
    await expect(countdown).toContainText(':');
  });

  test('should show the 5-minute expiry warning in the summary card', async ({ page }) => {
    await page.goto('/cart');
    const cart = new CartPage(page);

    await expect(cart.expiryWarning).toBeVisible();
    await expect(cart.expiryWarning).toContainText('5 percig');
  });
});

// ---------------------------------------------------------------------------
// 6–7. Item removal
// ---------------------------------------------------------------------------

test.describe('Cart Page – item removal', () => {
  test('should remove the item from the cart when the delete button is clicked', async ({
    page,
  }) => {
    await mockRefreshFail(page);
    await mockUnlockSuccess(page, MATCH_ID_1, SEAT_ID_AVAILABLE);
    await CartPage.seedSessionCart(page, [makeItem(SEAT_ID_AVAILABLE)], MATCH_ID_1);

    await page.goto('/cart');
    const cart = new CartPage(page);

    await expect(cart.cartRows).toHaveCount(1);

    await cart.removeButtonInRow(0).click();

    // The row disappears and the empty state takes over
    await expect(cart.cartRows).toHaveCount(0);
    await expect(cart.emptyCard).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 8–9. Checkout button behavior
// ---------------------------------------------------------------------------

test.describe('Cart Page – proceed to checkout', () => {
  test('should redirect unauthenticated user to /login?returnUrl=/checkout', async ({ page }) => {
    await mockRefreshFail(page);
    await CartPage.seedSessionCart(page, [makeItem(SEAT_ID_AVAILABLE)], MATCH_ID_1);

    await page.goto('/cart');
    const cart = new CartPage(page);

    await cart.checkoutButton.click();

    await expect(page).toHaveURL(/\/login\?returnUrl=%2Fcheckout/);
  });

  test('should navigate an authenticated user to /checkout', async ({ page }) => {
    await mockRefreshSuccess(page);
    // Stub checkout endpoint so the page doesn't crash when Stripe initializes
    await page.route('**/api/payments/intent', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          paymentIntentId: 'pi_test',
          clientSecret: 'pi_test_secret',
          currency: 'huf',
          amount: 3500,
          lineItems: [],
        }),
      }),
    );
    await page.route('**/api/matches/**/weather', (route) =>
      route.fulfill({ status: 404 }),
    );

    await CartPage.seedSessionCart(page, [makeItem(SEAT_ID_AVAILABLE)], MATCH_ID_1);

    await page.goto('/cart');
    const cart = new CartPage(page);

    await cart.checkoutButton.click();

    await expect(page).toHaveURL('/checkout');
  });
});

// ---------------------------------------------------------------------------
// 11. Item count badge shows 6 for max cart
// ---------------------------------------------------------------------------

test.describe('Cart Page – max items', () => {
  test('should show "6 jegy" in the header when the cart contains 6 items', async ({ page }) => {
    await mockRefreshFail(page);

    const sixItems = Array.from({ length: 6 }, (_, i) =>
      makeItem(`seat-${i}`, 3500),
    );
    await CartPage.seedSessionCart(page, sixItems, MATCH_ID_1);

    await page.goto('/cart');
    const cart = new CartPage(page);

    await expect(cart.itemCount).toContainText('6 jegy');
    await expect(cart.cartRows).toHaveCount(6);
  });
});

// ---------------------------------------------------------------------------
// 12. Warn styling when lock expires soon
// ---------------------------------------------------------------------------

test.describe('Cart Page – expiry warn styling', () => {
  test('should apply the warn CSS class when the lock expires in less than 60 seconds', async ({
    page,
  }) => {
    await mockRefreshFail(page);

    // Seed with a seat that expires in 30 seconds
    const expiringItem = makeItem(SEAT_ID_AVAILABLE, 3500, 30_000);
    await CartPage.seedSessionCart(page, [expiringItem], MATCH_ID_1);

    await page.goto('/cart');
    const countdown = new CartPage(page).countdownInRow(0);

    // The warn modifier class is applied when remainingMs < 60_000
    await expect(countdown).toHaveClass(/kte-cart__countdown--warn/);
  });
});
