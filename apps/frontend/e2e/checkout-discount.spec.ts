import { test, expect } from '@playwright/test';
import { CheckoutPage } from './pages/checkout.page';
import { CartPage } from './pages/cart.page';
import {
  MATCH_ID_1,
  SEAT_ID_AVAILABLE,
  OWNER_TOKEN,
  PAYMENT_INTENT_RESPONSE,
  AUTH_RESPONSE,
  AUTH_RESPONSE_GOLD,
} from './fixtures/api-mocks';

/**
 * E2E tests for the Tier-Based Discount at Checkout – KTE-046.
 *
 * DiscountBreakdownComponent is rendered inside the checkout summary aside
 * when the authenticated user has a discount-eligible loyalty tier
 * (silver 5%, gold 10%, platinum 15%).
 *
 * Bronze tier users must NOT see a discount row.
 *
 * All API calls are mocked. No live backend is required.
 *
 * Scenarios:
 *  1. Gold tier user sees the discount row in the summary aside
 *  2. Gold tier user discount row contains the correct percentage label
 *  3. Gold tier user discount amount reflects 10% off the subtotal
 *  4. Gold tier user total shown after discount is the discounted amount
 *  5. Bronze tier user does NOT see a discount row in the summary aside
 *  6. Order summary line count is correct for gold tier (seat + discount + total = 3 lines)
 *  7. Order summary line count is correct for bronze tier (seat + total = 2 lines)
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

function mockPaymentIntent(
  page: import('@playwright/test').Page,
  body = PAYMENT_INTENT_RESPONSE,
): Promise<void> {
  return page.route('**/api/payments/intent', (route) =>
    route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(body),
    }),
  );
}

function mockWeatherFail(page: import('@playwright/test').Page): Promise<void> {
  return page.route('**/api/matches/**/weather', (route) =>
    route.fulfill({ status: 404 }),
  );
}

/**
 * Injects a minimal Stripe mock so StripeService.createElements() resolves
 * without loading stripe.js from the CDN.
 */
async function injectStripeMock(page: import('@playwright/test').Page): Promise<void> {
  await page.addInitScript(() => {
    const mockElement = {
      mount: () => undefined,
      destroy: () => undefined,
      on: () => undefined,
    };
    const mockElements = {
      create: () => mockElement,
      submit: async () => ({ error: null }),
    };
    const mockStripe = {
      elements: () => mockElements,
      confirmPayment: async () => ({ error: null, paymentIntent: null }),
    };
    // @ts-ignore
    window.Stripe = () => mockStripe;
  });
}

/** Builds a standard cart item with a configurable section and price. */
function makeCartItem(
  seatId = SEAT_ID_AVAILABLE,
  section = 'A',
  price = 3500,
): Record<string, unknown> {
  return {
    seatId,
    matchId: MATCH_ID_1,
    homeTeam: 'Kecskeméti TE',
    awayTeam: 'Ferencvárosi TC',
    kickoffAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    section,
    row: '1',
    seatNumber: 5,
    category: 'standard',
    price,
    ownerToken: OWNER_TOKEN,
    lockExpiresAtMs: Date.now() + 280_000,
    addedAtMs: Date.now() - 20_000,
  };
}

/**
 * Builds a payment intent response that reflects a gold-tier discount (10%).
 * The server applies the discount server-side, so the lineItems price and
 * amount are already reduced.
 */
const GOLD_DISCOUNT_PERCENT = 10;
const SEAT_BASE_PRICE = 3500;
const GOLD_DISCOUNTED_PRICE = Math.round(SEAT_BASE_PRICE * (1 - GOLD_DISCOUNT_PERCENT / 100));

const PAYMENT_INTENT_GOLD = {
  ...PAYMENT_INTENT_RESPONSE,
  amount: GOLD_DISCOUNTED_PRICE,
  lineItems: [
    {
      seatId: SEAT_ID_AVAILABLE,
      section: 'A',
      row: '1',
      seatNumber: 5,
      price: SEAT_BASE_PRICE,
      discountPercent: GOLD_DISCOUNT_PERCENT,
      discountedPrice: GOLD_DISCOUNTED_PRICE,
    },
  ],
};

// ---------------------------------------------------------------------------
// Gold tier tests
// ---------------------------------------------------------------------------

test.describe('Checkout Discount – Gold tier (10% off)', () => {
  test.beforeEach(async ({ page }) => {
    await mockRefreshSuccess(page, AUTH_RESPONSE_GOLD);
    await CartPage.seedSessionCart(page, [makeCartItem()], MATCH_ID_1);
    await mockPaymentIntent(page, PAYMENT_INTENT_GOLD);
    await mockWeatherFail(page);
    await injectStripeMock(page);
  });

  test('should show the discount breakdown row in the summary aside for a gold tier user', async ({
    page,
  }) => {
    await page.goto('/checkout');
    const checkout = new CheckoutPage(page);

    await expect(checkout.discountRow).toBeVisible({ timeout: 8000 });
  });

  test('should display the correct discount percentage label in the discount row', async ({
    page,
  }) => {
    await page.goto('/checkout');
    const checkout = new CheckoutPage(page);

    await expect(checkout.discountRow).toBeVisible({ timeout: 8000 });
    // Label must contain the tier name and the percentage
    await expect(checkout.discountRow).toContainText(/arany/i);
    await expect(checkout.discountRow).toContainText(/10\s*%/);
  });

  test('should display the correct discount amount (−10% of subtotal) in the discount row', async ({
    page,
  }) => {
    await page.goto('/checkout');
    const checkout = new CheckoutPage(page);

    await expect(checkout.discountRow).toBeVisible({ timeout: 8000 });
    // Expected discount: 3500 * 0.10 = 350 Ft
    // The component should render a negative amount (−350 Ft or −350)
    await expect(checkout.discountRow).toContainText('350');
  });

  test('should show the correct discounted total in the summary aside', async ({ page }) => {
    await page.goto('/checkout');
    const checkout = new CheckoutPage(page);

    // Wait for the summary to fully render
    await expect(checkout.summaryAside).toBeVisible({ timeout: 8000 });

    // The total line must reflect the discounted price
    const totalText = await checkout.summaryAside
      .locator('.kte-checkout__line--total, .kte-checkout__total')
      .last()
      .textContent();
    expect(totalText).toContain(String(GOLD_DISCOUNTED_PRICE));
  });

  test('should show 3 lines in the summary aside: seat + discount + total', async ({ page }) => {
    await page.goto('/checkout');
    const checkout = new CheckoutPage(page);

    // Lines: 1 seat line, 1 discount line, 1 total line
    await expect(checkout.summaryAside.locator('.kte-checkout__line')).toHaveCount(3, {
      timeout: 8000,
    });
  });
});

// ---------------------------------------------------------------------------
// Bronze tier tests
// ---------------------------------------------------------------------------

test.describe('Checkout Discount – Bronze tier (no discount)', () => {
  test.beforeEach(async ({ page }) => {
    // AUTH_RESPONSE has loyaltyTier: 'bronze'
    await mockRefreshSuccess(page, AUTH_RESPONSE);
    await CartPage.seedSessionCart(page, [makeCartItem()], MATCH_ID_1);
    await mockPaymentIntent(page);
    await mockWeatherFail(page);
    await injectStripeMock(page);
  });

  test('should NOT show a discount row in the summary aside for a bronze tier user', async ({
    page,
  }) => {
    await page.goto('/checkout');
    const checkout = new CheckoutPage(page);

    // Wait for the summary to render
    await expect(checkout.summaryAside).toBeVisible({ timeout: 8000 });

    await expect(checkout.discountRow).not.toBeVisible();
  });

  test('should show exactly 2 lines in the summary aside: seat + total (no discount)', async ({
    page,
  }) => {
    await page.goto('/checkout');
    const checkout = new CheckoutPage(page);

    await expect(checkout.summaryAside.locator('.kte-checkout__line')).toHaveCount(2, {
      timeout: 8000,
    });
  });

  test('should show the full undiscounted seat price as the total', async ({ page }) => {
    await page.goto('/checkout');
    const checkout = new CheckoutPage(page);

    await expect(checkout.summaryAside).toBeVisible({ timeout: 8000 });

    const totalText = await checkout.summaryAside
      .locator('.kte-checkout__line--total, .kte-checkout__total')
      .last()
      .textContent();
    // Full price: 3 500 Ft
    expect(totalText).toContain(String(SEAT_BASE_PRICE));
  });
});
