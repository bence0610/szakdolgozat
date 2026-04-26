import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object for the Landing Page (/).
 *
 * Selector strategy:
 *  1. ARIA roles / accessible names — preferred (resilient, tests real a11y)
 *  2. Angular component CSS classes that carry semantic meaning (.kte-*)
 *  3. Text content for visible UI copy
 */
export class HomePage {
  readonly page: Page;

  // Hero section
  readonly heroSection: Locator;
  readonly heroTitle: Locator;
  readonly heroCtaBuyTickets: Locator;
  readonly heroCtaSeasonPass: Locator;

  // Countdown widget
  readonly countdownCard: Locator;
  readonly countdownMatchup: Locator;
  readonly countdownGrid: Locator;

  // Match list
  readonly matchListSection: Locator;
  readonly matchListHeading: Locator;
  readonly matchCards: Locator;
  readonly loadingSpinner: Locator;
  readonly errorMessage: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heroSection = page.locator('kte-hero-section section.kte-hero');
    this.heroTitle = page.locator('#kte-hero-title');
    this.heroCtaBuyTickets = page.getByRole('link', { name: /jegyvásárlás/i });
    this.heroCtaSeasonPass = page.getByRole('link', { name: /bérletek/i });

    this.countdownCard = page.locator('kte-match-countdown mat-card.kte-countdown');
    this.countdownMatchup = page.locator('.kte-countdown__matchup');
    this.countdownGrid = page.locator('.kte-countdown__grid');

    this.matchListSection = page.locator('kte-match-list section.kte-match-list');
    this.matchListHeading = page.locator('#kte-match-list-title');
    this.matchCards = page.locator('kte-match-list-item mat-card.kte-match-card');
    this.loadingSpinner = page.locator('kte-match-list .kte-match-list__loading');
    this.errorMessage = page.locator('kte-match-list .kte-match-list__error');
    this.emptyState = page.locator('kte-match-list .kte-match-list__empty');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  /**
   * Returns the match card at the given zero-based index.
   */
  matchCard(index: number): Locator {
    return this.matchCards.nth(index);
  }

  /**
   * Returns the "Jegyvásárlás" button inside a match card.
   */
  buyTicketsButtonInCard(cardLocator: Locator): Locator {
    return cardLocator.getByRole('link', { name: /jegyvásárlás/i });
  }

  /**
   * Returns the home/away team names inside a specific card.
   */
  teamNamesInCard(cardLocator: Locator): { home: Locator; away: Locator } {
    return {
      home: cardLocator.locator('.kte-match-card__team--home'),
      away: cardLocator.locator('.kte-match-card__team--away'),
    };
  }

  /**
   * Returns the status badge inside a specific card.
   */
  statusBadgeInCard(cardLocator: Locator): Locator {
    return cardLocator.locator('.kte-match-card__status');
  }
}
