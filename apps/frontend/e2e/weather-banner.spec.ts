import { test, expect } from '@playwright/test';
import { CheckoutPage } from './pages/checkout.page';
import { CartPage } from './pages/cart.page';
import {
  MATCH_ID_1,
  SEAT_ID_AVAILABLE,
  OWNER_TOKEN,
  PAYMENT_INTENT_RESPONSE,
  WEATHER_RAIN_WARNING,
  WEATHER_CLEAR,
  AUTH_RESPONSE,
} from './fixtures/api-mocks';

/**
 * E2E tests for the Weather Banner component – KTE-060 (Iteration 5).
 *
 * The WeatherBannerComponent is rendered on the /checkout page. It calls
 * GET /api/matches/:id/weather and shows a rain warning alert when
 * rainWarning === true AND the cart contains at least one non-VIP seat.
 *
 * These focused tests complement the broader checkout.spec.ts scenarios.
 * They exist as a dedicated suite so the weather feature can be run in
 * isolation (e.g., --grep weather-banner).
 *
 * Scenarios:
 *  1. Banner appears with "Esőzés várható" text when rain is forecast
 *  2. "Másik szektor választása" link is visible alongside the rain warning
 *  3. Banner does NOT appear when the forecast has no rain warning
 *  4. Banner does NOT appear when all cart seats are in the VIP (covered) sector
 *  5. Banner does NOT appear when the weather API returns a non-2xx response
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

function mockPaymentIntent(page: import('@playwright/test').Page): Promise<void> {
  return page.route('**/api/payments/intent', (route) =>
    route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(PAYMENT_INTENT_RESPONSE),
    }),
  );
}

function mockWeather(
  page: import('@playwright/test').Page,
  body: unknown,
): Promise<void> {
  return page.route('**/api/matches/**/weather', (route) =>
    route.fulfill({
      status: 200,
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
 * Injects a minimal Stripe stub so the StripeService resolves without loading
 * the real Stripe SDK from CDN. Identical to the stub in checkout.spec.ts.
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

function makeCartItem(section = 'A'): Record<string, unknown> {
  return {
    seatId: SEAT_ID_AVAILABLE,
    matchId: MATCH_ID_1,
    homeTeam: 'Kecskeméti TE',
    awayTeam: 'Ferencvárosi TC',
    kickoffAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    section,
    row: '1',
    seatNumber: 5,
    category: 'standard',
    price: 3500,
    ownerToken: OWNER_TOKEN,
    lockExpiresAtMs: Date.now() + 280_000,
    addedAtMs: Date.now() - 20_000,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Weather Banner – /checkout (KTE-060)', () => {
  test.beforeEach(async ({ page }) => {
    await mockRefreshSuccess(page);
  });

  test('should show a rain warning banner when rain is forecast for a non-VIP seat', async ({
    page,
  }) => {
    await CartPage.seedSessionCart(page, [makeCartItem('A')], MATCH_ID_1);
    await mockPaymentIntent(page);
    await mockWeather(page, WEATHER_RAIN_WARNING);
    await injectStripeMock(page);

    await page.goto('/checkout');
    const checkout = new CheckoutPage(page);

    // The banner has role="alert" and contains the warning text
    await expect(checkout.weatherBanner).toBeVisible({ timeout: 5000 });
    await expect(checkout.weatherBanner).toContainText('Esőzés várható');
  });

  test('should show the "Másik szektor választása" link alongside the rain warning', async ({
    page,
  }) => {
    await CartPage.seedSessionCart(page, [makeCartItem('A')], MATCH_ID_1);
    await mockPaymentIntent(page);
    await mockWeather(page, WEATHER_RAIN_WARNING);
    await injectStripeMock(page);

    await page.goto('/checkout');
    const checkout = new CheckoutPage(page);

    await expect(checkout.weatherBanner).toBeVisible({ timeout: 5000 });
    await expect(checkout.weatherBannerChangeSection).toBeVisible();
  });

  test('should NOT show the banner when the forecast reports no rain (rainWarning = false)', async ({
    page,
  }) => {
    await CartPage.seedSessionCart(page, [makeCartItem('A')], MATCH_ID_1);
    await mockPaymentIntent(page);
    await mockWeather(page, WEATHER_CLEAR);
    await injectStripeMock(page);

    await page.goto('/checkout');
    const checkout = new CheckoutPage(page);

    // Allow time for the weather API response to be processed
    await page.waitForTimeout(500);
    await expect(checkout.weatherBanner).not.toBeVisible();
  });

  test('should NOT show the banner when all cart seats are in the VIP (covered) sector', async ({
    page,
  }) => {
    // VIP is in the COVERED_SECTORS constant inside WeatherBannerComponent;
    // rain warnings are suppressed for covered stands.
    await CartPage.seedSessionCart(page, [makeCartItem('VIP')], MATCH_ID_1);
    await mockPaymentIntent(page);
    await mockWeather(page, WEATHER_RAIN_WARNING);
    await injectStripeMock(page);

    await page.goto('/checkout');
    const checkout = new CheckoutPage(page);

    await page.waitForTimeout(500);
    await expect(checkout.weatherBanner).not.toBeVisible();
  });

  test('should NOT show the banner when the weather API returns an error response', async ({
    page,
  }) => {
    await CartPage.seedSessionCart(page, [makeCartItem('A')], MATCH_ID_1);
    await mockPaymentIntent(page);
    await mockWeatherFail(page);
    await injectStripeMock(page);

    await page.goto('/checkout');
    const checkout = new CheckoutPage(page);

    await page.waitForTimeout(500);
    await expect(checkout.weatherBanner).not.toBeVisible();
  });
});
