import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object for the User Profile page (/profile).
 *
 * Selector strategy:
 *  1. ARIA roles / headings
 *  2. Angular Material tab labels
 *  3. CSS classes with .kte-profile-* prefix
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

  // Active tickets
  readonly activeTicketCards: Locator;
  readonly activeTicketsEmpty: Locator;

  // Past tickets
  readonly pastTicketCards: Locator;
  readonly pastTicketsEmpty: Locator;

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

    this.activeTicketCards = page.locator('.kte-profile__tickets mat-card');
    this.activeTicketsEmpty = page.locator('.kte-profile__empty').first();

    // Past tickets panel is the second tab panel
    this.pastTicketCards = page.locator('.kte-profile__history mat-card');
    this.pastTicketsEmpty = page.locator('.kte-profile__empty').last();

    this.logoutButton = page.getByRole('button', { name: /kijelentkezés/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/profile');
  }
}
