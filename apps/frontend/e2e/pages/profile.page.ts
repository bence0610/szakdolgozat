import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object for the User Profile page (/profile).
 *
 * Updated for Iteration 4: added TicketCard locators (QR dialog, download
 * button), season pass section locators, and loan flow locators.
 *
 * Selector strategy:
 *  1. ARIA roles / headings
 *  2. Angular Material tab labels
 *  3. CSS classes with .kte-profile-* prefix
 *  4. data-testid attributes on Iteration 4 components
 */
export class ProfilePage {
  readonly page: Page;

  // Hero card
  readonly heroCard: Locator;
  readonly avatarInitials: Locator;
  readonly fullName: Locator;
  readonly email: Locator;
  readonly loyaltyChip: Locator;
  readonly loyaltyPoints: Locator;

  // Loading state
  readonly loader: Locator;

  // Tabs
  readonly activeTicketsTab: Locator;
  readonly pastTicketsTab: Locator;

  // Active tickets (TicketCardComponent instances)
  readonly activeTicketCards: Locator;
  readonly activeTicketsEmpty: Locator;

  // Past tickets panel is the second tab panel
  readonly pastTicketCards: Locator;
  readonly pastTicketsEmpty: Locator;

  // TicketCardComponent — KTE-041: QR dialog trigger + download button.
  // These locators are scoped to the first active ticket card by default;
  // use .nth(n) or scope them in the test for multi-ticket scenarios.
  readonly ticketQrButton: Locator;
  readonly ticketDownloadButton: Locator;

  // TicketQrDialogComponent — opened via ticketQrButton
  readonly qrDialog: Locator;
  readonly qrImage: Locator;
  readonly qrDialogDownloadButton: Locator;
  readonly qrDialogCloseButton: Locator;

  // Season passes section (KTE-051 / KTE-054)
  readonly seasonPassesSection: Locator;
  readonly seasonPassCards: Locator;
  readonly seasonPassesEmpty: Locator;

  // Loan initiation dialog (KTE-051) — 4-step stepper inside a mat-dialog
  readonly loanDialog: Locator;
  readonly loanInitiateButton: Locator;

  // Loan stepper steps
  readonly loanStep1: Locator;
  readonly loanMatchList: Locator;
  readonly loanStep1Next: Locator;

  readonly loanStep2: Locator;
  readonly loanEmailInput: Locator;
  readonly loanEmailError: Locator;
  readonly loanStep2Next: Locator;
  readonly loanStep2Back: Locator;

  readonly loanStep3: Locator;
  readonly loanSummaryMatchName: Locator;
  readonly loanSummaryEmail: Locator;
  readonly loanStep3Confirm: Locator;
  readonly loanStep3ErrorBanner: Locator;
  readonly loanStep3Back: Locator;

  readonly loanStep4: Locator;
  readonly loanSuccessQr: Locator;
  readonly loanStep4Close: Locator;

  // "Mégsem" button present on steps 1–3
  readonly loanCancelButton: Locator;

  // Active loans list — cancel button (KTE-054)
  readonly activeLoans: Locator;
  readonly loanCancelItemButton: Locator;

  // Footer action
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heroCard = page.locator('mat-card.kte-profile__hero');
    this.avatarInitials = page.locator('.kte-profile__avatar');
    this.fullName = page.locator('.kte-profile__identity h1');
    this.email = page.locator('.kte-profile__identity p').first();
    this.loyaltyChip = page.locator('mat-chip');
    this.loyaltyPoints = page.locator('.kte-profile__loyalty strong');

    this.loader = page.locator('.kte-profile__loader[role="status"]');

    // Tab group — the label text contains the dynamic count in parentheses
    this.activeTicketsTab = page.getByRole('tab', { name: /aktív jegyek/i });
    this.pastTicketsTab = page.getByRole('tab', { name: /vásárlási előzmények/i });

    // Iteration 4: active ticket list is rendered as kte-ticket-card components
    // inside the .kte-profile__tickets container.
    this.activeTicketCards = page.locator('.kte-profile__tickets kte-ticket-card');
    this.activeTicketsEmpty = page.locator('.kte-profile__empty').first();

    this.pastTicketCards = page.locator('.kte-profile__history mat-card');
    this.pastTicketsEmpty = page.locator('.kte-profile__empty').last();

    // KTE-041 — TicketCardComponent QR / download controls.
    // These are present on each kte-ticket-card; tests should scope them
    // via .nth() when multiple cards exist.
    this.ticketQrButton = page.getByRole('button', { name: /qr megtekintés/i });
    this.ticketDownloadButton = page.getByRole('button', { name: /jegy letöltése/i });

    // KTE-041 — TicketQrDialogComponent (mat-dialog overlay)
    this.qrDialog = page.locator('mat-dialog-container[data-testid="ticket-qr-dialog"]');
    this.qrImage = page.locator('img[data-testid="ticket-qr"]');
    this.qrDialogDownloadButton = page.getByRole('button', { name: /letöltés/i });
    this.qrDialogCloseButton = page.getByRole('button', { name: /bezárás/i }).first();

    // Season passes section
    this.seasonPassesSection = page.locator('.kte-profile__season-passes');
    this.seasonPassCards = page.locator('.kte-profile__season-passes kte-season-pass-card');
    this.seasonPassesEmpty = page.locator('.kte-profile__season-passes .kte-profile__empty');

    // KTE-051 — Loan initiation
    this.loanInitiateButton = page.getByRole('button', { name: /kölcsön adás/i });
    this.loanDialog = page.locator('mat-dialog-container[data-testid="loan-dialog"]');

    // Step 1 — match selection
    this.loanStep1 = page.locator('[data-testid="loan-step-1"]');
    this.loanMatchList = page.locator('[data-testid="loan-match-list"]');
    this.loanStep1Next = page.getByRole('button', { name: /következő/i }).first();

    // Step 2 — email
    this.loanStep2 = page.locator('[data-testid="loan-step-2"]');
    this.loanEmailInput = page.getByLabel(/email/i);
    this.loanEmailError = page.locator('[data-testid="loan-email-error"]');
    this.loanStep2Next = page.getByRole('button', { name: /következő/i }).first();
    this.loanStep2Back = page.getByRole('button', { name: /vissza/i }).first();

    // Step 3 — summary + confirm
    this.loanStep3 = page.locator('[data-testid="loan-step-3"]');
    this.loanSummaryMatchName = page.locator('[data-testid="loan-summary-match"]');
    this.loanSummaryEmail = page.locator('[data-testid="loan-summary-email"]');
    this.loanStep3Confirm = page.getByRole('button', { name: /megerősítés/i });
    this.loanStep3ErrorBanner = page.locator('[data-testid="loan-error-banner"]');
    this.loanStep3Back = page.getByRole('button', { name: /vissza/i }).first();

    // Step 4 — success + QR
    this.loanStep4 = page.locator('[data-testid="loan-step-4"]');
    this.loanSuccessQr = page.locator('[data-testid="loan-success-qr"]');
    this.loanStep4Close = page.getByRole('button', { name: /bezárás/i }).last();

    // Mégsem — present on steps 1–3 inside the dialog
    this.loanCancelButton = page.getByRole('button', { name: /mégsem/i });

    // KTE-054 — Active loan cancellation
    this.activeLoans = page.locator('.kte-profile__active-loans');
    this.loanCancelItemButton = page.getByRole('button', { name: /lemondás/i });

    this.logoutButton = page.getByRole('button', { name: /kijelentkezés/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/profile');
  }

  /**
   * Returns the "QR megtekintés" button scoped to the nth ticket card (zero-based).
   */
  qrButtonInCard(index: number): Locator {
    return this.activeTicketCards.nth(index).getByRole('button', { name: /qr megtekintés/i });
  }

  /**
   * Returns the "Jegy letöltése" button scoped to the nth ticket card (zero-based).
   */
  downloadButtonInCard(index: number): Locator {
    return this.activeTicketCards.nth(index).getByRole('button', { name: /jegy letöltése/i });
  }

  /**
   * Returns the Cancel-loan button for the nth active loan row (zero-based).
   */
  cancelLoanButtonInRow(index: number): Locator {
    return this.activeLoans.locator('mat-card').nth(index).getByRole('button', { name: /lemondás/i });
  }
}
