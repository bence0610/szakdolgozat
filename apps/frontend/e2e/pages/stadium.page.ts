import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object for the Stadium Page (/stadium?matchId=...).
 *
 * Selector strategy:
 *  1. ARIA roles / labels — stadium map sectors have role="button" + aria-label
 *  2. Semantic .kte-* CSS classes
 *  3. Visible text for labels/headings
 */
export class StadiumPage {
  readonly page: Page;

  // Header
  readonly pageHeading: Locator;
  readonly matchSelector: Locator;

  // Sector summary
  readonly sectorSummary: Locator;

  // Stadium map SVG sectors — each <g> has role="button" and aria-label
  readonly sectorA: Locator;
  readonly sectorB: Locator;
  readonly sectorC: Locator;
  readonly sectorVIP: Locator;

  // Seat grid
  readonly seatGrid: Locator;
  readonly seatGridHeading: Locator;

  // Accessibility toggle
  readonly accessibilityToggle: Locator;

  // Seat detail panel (desktop sidenav)
  readonly seatDetailPanel: Locator;
  readonly seatDetailHeader: Locator;
  readonly kosarbaButton: Locator;
  readonly lockCountdownHeader: Locator;
  readonly progressBar: Locator;
  readonly releaseButton: Locator;
  readonly closeButton: Locator;

  // Loading / empty state
  readonly loadingSpinner: Locator;
  readonly noMatchEmpty: Locator;

  // Snackbar
  readonly snackbar: Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageHeading = page.getByRole('heading', { name: 'Stadion ülésrend' });
    this.matchSelector = page.locator('kte-match-selector');

    this.sectorSummary = page.locator('kte-sector-summary');

    // The SVG sector <g> elements have role="button" and aria-label containing
    // the section label (e.g. "Észak — A szektor").
    this.sectorA = page.getByRole('button', { name: /észak.*a szektor/i });
    this.sectorB = page.getByRole('button', { name: /dél.*b szektor/i });
    this.sectorC = page.getByRole('button', { name: /kelet.*c szektor/i });
    this.sectorVIP = page.getByRole('button', { name: /nyugat.*vip/i });

    this.seatGrid = page.locator('kte-seat-grid section.kte-seat-grid');
    this.seatGridHeading = page.locator('kte-seat-grid .kte-seat-grid__header h3');

    this.accessibilityToggle = page
      .locator('kte-accessibility-toggle')
      .getByRole('switch', { name: /akadálymentes/i });

    this.seatDetailPanel = page.locator('kte-seat-detail-panel aside.kte-seat-detail');
    this.seatDetailHeader = page.locator('.kte-seat-detail__header h3');
    this.kosarbaButton = page.getByRole('button', { name: /kosárba/i });
    this.lockCountdownHeader = page.locator('.kte-seat-detail__lock header span');
    this.progressBar = page.locator('mat-progress-bar');
    this.releaseButton = page.getByRole('button', { name: /foglalás elengedése/i });
    this.closeButton = page.getByRole('button', { name: /bezárás/i });

    this.loadingSpinner = page.locator('.kte-stadium__loading mat-progress-spinner');
    this.noMatchEmpty = page.locator('.kte-stadium__empty');

    // Material snackbar appears outside the Angular app root — query the
    // document-level container to avoid timing issues.
    this.snackbar = page.locator('mat-snack-bar-container');
  }

  async goto(matchId?: string): Promise<void> {
    const url = matchId ? `/stadium?matchId=${matchId}` : '/stadium';
    await this.page.goto(url);
  }

  /**
   * Returns all available seat buttons within the currently rendered grid.
   * Available seats have the CSS class "kte-seat--available" and are enabled.
   */
  get availableSeats(): Locator {
    return this.page.locator('button.kte-seat.kte-seat--available:not(:disabled)');
  }

  /**
   * Returns accessible-only seats in the grid.
   */
  get accessibleSeats(): Locator {
    return this.page.locator('button.kte-seat.kte-seat--accessible');
  }

  /**
   * Returns seats that are NOT accessible (no .kte-seat--accessible class).
   * Used to verify the accessibility filter hides them.
   */
  get nonAccessibleAvailableSeats(): Locator {
    return this.page.locator(
      'button.kte-seat.kte-seat--available:not(.kte-seat--accessible)',
    );
  }

  /**
   * Clicks the match-selector <select> or <mat-select> and picks the option
   * whose label contains the given text.
   */
  async selectMatch(matchLabel: string): Promise<void> {
    // The MatchSelectorComponent renders a mat-select.
    await this.matchSelector.getByRole('combobox').click();
    await this.page.getByRole('option', { name: new RegExp(matchLabel, 'i') }).click();
  }
}
