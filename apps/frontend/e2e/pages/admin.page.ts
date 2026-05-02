import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object for the Admin section.
 *
 * AdminPage (/admin) — wrapper layout with header and tab nav.
 * SeatHeatmapPage (/admin/heatmap) — SVG occupancy heatmap with match picker.
 * RevenueStatsPage (/admin/revenue) — summary cards + chart + match table.
 *
 * The adminGuard (KTE-063) redirects non-admin users before the page renders:
 *  - Unauthenticated users → /login
 *  - Authenticated FAN users → /
 *
 * Selector strategy:
 *  1. ARIA roles / headings (preferred)
 *  2. .kte-admin-*, .kte-revenue-*, .kte-heatmap-* CSS classes
 *  3. Component selectors (kte-revenue-summary-card, kte-stadium-heatmap)
 */
export class AdminPage {
  readonly page: Page;

  // ---------- Admin layout shell ----------

  /** Top-level <h1> inside .kte-admin__header */
  readonly pageHeading: Locator;

  /** Navigation link to the revenue sub-page */
  readonly revenueNavLink: Locator;

  /** Navigation link to the heatmap sub-page */
  readonly heatmapNavLink: Locator;

  // ---------- Revenue page (/admin/revenue) ----------

  /** Summary card components (kte-revenue-summary-card) */
  readonly revenueSummaryCards: Locator;

  /** Line chart component */
  readonly revenueLineChart: Locator;

  /** Match breakdown table */
  readonly revenueMatchTable: Locator;

  /** Loading spinner for the revenue page */
  readonly revenueLoader: Locator;

  /** Error alert for the revenue page */
  readonly revenueError: Locator;

  // ---------- Heatmap page (/admin/heatmap) ----------

  /** SVG element rendered by StadiumHeatmapComponent */
  readonly heatmapSvg: Locator;

  /** The kte-heatmap-match-picker component */
  readonly heatmapMatchPicker: Locator;

  /** The occupancy percentage summary text block */
  readonly heatmapSummary: Locator;

  /** Loading indicator for the heatmap page */
  readonly heatmapLoader: Locator;

  /** Error alert for the heatmap page */
  readonly heatmapError: Locator;

  /** Empty-state text when no match is selected */
  readonly heatmapEmpty: Locator;

  constructor(page: Page) {
    this.page = page;

    // Admin layout
    this.pageHeading = page.getByRole('heading', { name: /admin felület/i });
    this.revenueNavLink = page.getByRole('link', { name: /bevételi statisztikák/i });
    this.heatmapNavLink = page.getByRole('link', { name: /foglaltsági heatmap/i });

    // Revenue page
    // RevenueSummaryCardComponent renders each summary card as a distinct element.
    this.revenueSummaryCards = page.locator('kte-revenue-summary-card');
    this.revenueLineChart = page.locator('kte-revenue-line-chart');
    this.revenueMatchTable = page.locator('kte-revenue-by-match-table');
    this.revenueLoader = page.locator('.kte-revenue__loader');
    this.revenueError = page.locator('.kte-revenue__error[role="alert"]');

    // Heatmap page
    // StadiumHeatmapComponent renders an <svg> with role="img"
    this.heatmapSvg = page.locator('kte-stadium-heatmap svg[role="img"]');
    this.heatmapMatchPicker = page.locator('kte-heatmap-match-picker');
    this.heatmapSummary = page.locator('.kte-heatmap-page__summary');
    this.heatmapLoader = page.locator('.kte-heatmap-page__loader[role="status"]');
    this.heatmapError = page.locator('.kte-heatmap-page__error[role="alert"]');
    this.heatmapEmpty = page.locator('.kte-heatmap-page__empty');
  }

  async gotoRevenue(): Promise<void> {
    await this.page.goto('/admin/revenue');
  }

  async gotoHeatmap(): Promise<void> {
    await this.page.goto('/admin/heatmap');
  }

  /**
   * Clicks the match picker's <select> / mat-select and picks the option
   * matching the provided label text (partial match, case-insensitive).
   */
  async selectMatch(matchLabel: string): Promise<void> {
    await this.heatmapMatchPicker.getByRole('combobox').click();
    await this.page.getByRole('option', { name: new RegExp(matchLabel, 'i') }).click();
  }
}
