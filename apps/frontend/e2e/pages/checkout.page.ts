import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object for the Checkout page (/checkout) and Confirmation page
 * (/checkout/confirmation).
 *
 * The Stripe payment element is rendered inside an iframe that Playwright
 * cannot interact with directly in a mocked environment. Tests should stub
 * the Stripe SDK via page.addInitScript() or route interception and only
 * assert on the surrounding Angular UI.
 *
 * Selector strategy:
 *  1. Heading / ARIA roles
 *  2. .kte-checkout-* and .kte-confirmation-* CSS classes
 *  3. Visible text for button labels
 */
export class CheckoutPage {
  readonly page: Page;

  // ---------- Checkout page ----------

  readonly pageHeading: Locator;
  readonly backToCartLink: Locator;

  // Empty state (no cart items)
  readonly emptyState: Locator;

  // Weather banner
  readonly weatherBanner: Locator;
  readonly weatherBannerChangeSection: Locator;

  // Buyer details card
  readonly buyerDetailsCard: Locator;
  readonly buyerName: Locator;
  readonly buyerEmail: Locator;

  // Payment card
  readonly paymentCard: Locator;
  readonly stripeLoader: Locator;
  readonly initializationError: Locator;
  readonly paymentError: Locator;
  readonly paymentButton: Locator;
  readonly supportBlock: Locator;

  // Summary aside
  readonly summaryAside: Locator;
  readonly lockStatusCountdown: Locator;

  // ---------- Confirmation page ----------

  readonly confirmationCard: Locator;
  readonly successHeading: Locator;
  readonly orderIdBlock: Locator;
  readonly seatList: Locator;
  readonly totalPaid: Locator;
  readonly profileLink: Locator;
  readonly homeLink: Locator;

  // Guard card (no navigation state)
  readonly guardCard: Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageHeading = page.locator('section.kte-checkout h1');
    this.backToCartLink = page.getByRole('link', { name: /vissza a kosárhoz/i });

    this.emptyState = page.locator('mat-card.kte-checkout__empty');

    this.weatherBanner = page.locator('kte-weather-banner .kte-weather[role="alert"]');
    this.weatherBannerChangeSection = page.getByRole('link', { name: /másik szektor választása/i });

    this.buyerDetailsCard = page.locator('section.kte-checkout mat-card').first();
    this.buyerName = page.locator('.kte-checkout__user-grid dd').first();
    this.buyerEmail = page.locator('.kte-checkout__user-grid dd').nth(1);

    this.paymentCard = page.locator('section.kte-checkout mat-card').nth(1);
    this.stripeLoader = page.locator('.kte-checkout__loader');
    this.initializationError = page.locator('.kte-checkout__error[role="alert"]').first();
    this.paymentError = page.locator('.kte-checkout__error[role="alert"]').last();
    this.paymentButton = page.getByRole('button', { name: /biztonságos fizetés/i });
    this.supportBlock = page.locator('.kte-checkout__support');

    this.summaryAside = page.locator('aside.kte-checkout__summary');
    this.lockStatusCountdown = page.locator('.kte-checkout__lock-status');

    // Confirmation page
    this.confirmationCard = page.locator('mat-card.kte-confirmation__card');
    this.successHeading = page.locator('section.kte-confirmation h1');
    this.orderIdBlock = page.locator('.kte-confirmation__order-id strong');
    this.seatList = page.locator('ul.kte-confirmation__seats li');
    this.totalPaid = page.locator('.kte-confirmation__total strong').last();
    this.profileLink = page.getByRole('link', { name: /profil megnyitása/i });
    this.homeLink = page.getByRole('link', { name: /vissza a kezdőlapra/i });

    this.guardCard = page.locator('mat-card.kte-confirmation__guard');
  }

  async gotoCheckout(): Promise<void> {
    await this.page.goto('/checkout');
  }

  async gotoConfirmation(): Promise<void> {
    await this.page.goto('/checkout/confirmation');
  }
}
