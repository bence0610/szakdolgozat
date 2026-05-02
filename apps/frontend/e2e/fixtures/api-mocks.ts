/**
 * Canonical API mock payloads for KTE Jegyportál E2E tests.
 *
 * Keeping all fixtures in one place makes it trivial to update them when
 * the DTOs change — test files import from here instead of defining
 * inline payloads.
 *
 * Updated for Iteration 3: auth, cart, payment, and weather fixtures added.
 * Updated for Iteration 4: loyalty, ticket QR, season pass, and loan fixtures added.
 */

// ---------------------------------------------------------------------------
// Matches
// ---------------------------------------------------------------------------

export const MATCH_ID_1 = 'aaaaaaaa-0000-4000-8000-000000000001';
export const MATCH_ID_2 = 'aaaaaaaa-0000-4000-8000-000000000002';

export const FUTURE_KICKOFF_1 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
export const FUTURE_KICKOFF_2 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

export const MATCH_LIST_ITEM_1 = {
  id: MATCH_ID_1,
  homeTeam: 'Kecskeméti TE',
  awayTeam: 'Ferencvárosi TC',
  competition: 'NB1',
  venue: 'Széktói Stadion, Kecskemét',
  kickoffAt: FUTURE_KICKOFF_1,
  status: 'on_sale',
  basePrice: 3500,
  capacity: 8200,
  availableSeats: 6100,
  isHome: true,
  bannerImageUrl: null,
  isSeasonPassEligible: true,
};

export const MATCH_LIST_ITEM_2 = {
  id: MATCH_ID_2,
  homeTeam: 'Kecskeméti TE',
  awayTeam: 'Puskás Akadémia',
  competition: 'NB1',
  venue: 'Széktói Stadion, Kecskemét',
  kickoffAt: FUTURE_KICKOFF_2,
  status: 'on_sale',
  basePrice: 3000,
  capacity: 8200,
  availableSeats: 7500,
  isHome: true,
  bannerImageUrl: null,
  isSeasonPassEligible: true,
};

export const MATCH_LIST = [MATCH_LIST_ITEM_1, MATCH_LIST_ITEM_2];

// ---------------------------------------------------------------------------
// Seats
// ---------------------------------------------------------------------------

export const SEAT_ID_AVAILABLE = 'cccccccc-0000-4000-8000-000000000001';
export const SEAT_ID_LOCKED = 'cccccccc-0000-4000-8000-000000000002';
export const SEAT_ID_SOLD = 'cccccccc-0000-4000-8000-000000000003';
export const SEAT_ID_ACCESSIBLE = 'cccccccc-0000-4000-8000-000000000004';
export const SEAT_ID_NON_ACCESSIBLE = 'cccccccc-0000-4000-8000-000000000005';

export const SEAT_AVAILABLE = {
  id: SEAT_ID_AVAILABLE,
  section: 'A',
  row: '1',
  number: 5,
  category: 'standard',
  price: 3500,
  status: 'available',
  isAccessible: false,
};

export const SEAT_LOCKED = {
  id: SEAT_ID_LOCKED,
  section: 'A',
  row: '1',
  number: 6,
  category: 'standard',
  price: 3500,
  status: 'locked',
  isAccessible: false,
};

export const SEAT_SOLD = {
  id: SEAT_ID_SOLD,
  section: 'A',
  row: '1',
  number: 7,
  category: 'standard',
  price: 3500,
  status: 'sold',
  isAccessible: false,
};

export const SEAT_ACCESSIBLE = {
  id: SEAT_ID_ACCESSIBLE,
  section: 'A',
  row: '2',
  number: 1,
  category: 'standard',
  price: 3500,
  status: 'available',
  isAccessible: true,
};

export const SEAT_NON_ACCESSIBLE_AVAILABLE = {
  id: SEAT_ID_NON_ACCESSIBLE,
  section: 'A',
  row: '2',
  number: 2,
  category: 'standard',
  price: 3500,
  status: 'available',
  isAccessible: false,
};

export const MATCH_SEATS_RESPONSE = {
  matchId: MATCH_ID_1,
  seats: [SEAT_AVAILABLE, SEAT_LOCKED, SEAT_SOLD, SEAT_ACCESSIBLE, SEAT_NON_ACCESSIBLE_AVAILABLE],
  sectorSummary: [
    {
      section: 'A',
      total: 5,
      available: 3,
      locked: 1,
      sold: 1,
      occupancyRatio: 0.4,
    },
    {
      section: 'B',
      total: 10,
      available: 10,
      locked: 0,
      sold: 0,
      occupancyRatio: 0.0,
    },
    {
      section: 'C',
      total: 8,
      available: 8,
      locked: 0,
      sold: 0,
      occupancyRatio: 0.0,
    },
    {
      section: 'VIP',
      total: 4,
      available: 4,
      locked: 0,
      sold: 0,
      occupancyRatio: 0.0,
    },
  ],
};

// ---------------------------------------------------------------------------
// Lock responses
// ---------------------------------------------------------------------------

export const OWNER_TOKEN = 'dddddddd-0000-4000-8000-000000000001';

export const LOCK_SUCCESS_RESPONSE = {
  matchId: MATCH_ID_1,
  seatId: SEAT_ID_AVAILABLE,
  ownerToken: OWNER_TOKEN,
  ttlSeconds: 300,
  expiresAt: new Date(Date.now() + 300_000).toISOString(),
};

export const LOCK_CONFLICT_BODY = {
  statusCode: 409,
  message: `Seat ${SEAT_ID_AVAILABLE} for match ${MATCH_ID_1} is already locked. Please pick a different seat.`,
  error: 'Conflict',
};

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const USER_ID = 'eeeeeeee-0000-4000-8000-000000000001';

export const AUTH_USER = {
  id: USER_ID,
  email: 'test@kte.hu',
  firstName: 'Teszt',
  lastName: 'Felhasználó',
  role: 'fan',
  loyaltyTier: 'bronze',
  loyaltyPoints: 120,
};

/** Full AuthResponse returned by /auth/login and /auth/register */
export const AUTH_RESPONSE = {
  accessToken: 'fake-access-token',
  refreshToken: 'fake-refresh-token',
  expiresIn: 900,
  user: AUTH_USER,
};

/** /users/me extended profile */
export const USER_PROFILE = {
  id: USER_ID,
  email: 'test@kte.hu',
  firstName: 'Teszt',
  lastName: 'Felhasználó',
  phoneNumber: '+36301234567',
  role: 'fan',
  loyaltyTier: 'bronze',
  loyaltyPoints: 120,
  emailVerified: true,
  twoFactorEnabled: false,
  lastLoginAt: new Date(Date.now() - 86_400_000).toISOString(),
  createdAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
};

/** Active ticket in the /users/me/tickets response */
export const TICKET_ACTIVE = {
  id: 'ffffffff-0000-4000-8000-000000000001',
  matchId: MATCH_ID_1,
  homeTeam: 'Kecskeméti TE',
  awayTeam: 'Ferencvárosi TC',
  kickoffAt: FUTURE_KICKOFF_1,
  venue: 'Széktói Stadion, Kecskemét',
  section: 'A',
  row: '1',
  seatNumber: 5,
  category: 'standard',
  status: 'paid',
  pricePaid: 3500,
  currency: 'HUF',
  qrCode: 'QR-TEST-0001',
  purchasedAt: new Date(Date.now() - 3_600_000).toISOString(),
  isActive: true,
};

/** Past ticket */
export const TICKET_PAST = {
  id: 'ffffffff-0000-4000-8000-000000000002',
  matchId: MATCH_ID_2,
  homeTeam: 'Kecskeméti TE',
  awayTeam: 'Puskás Akadémia',
  kickoffAt: new Date(Date.now() - 7 * 86_400_000).toISOString(),
  venue: 'Széktói Stadion, Kecskemét',
  section: 'B',
  row: '3',
  seatNumber: 12,
  category: 'standard',
  status: 'used',
  pricePaid: 3000,
  currency: 'HUF',
  qrCode: 'QR-TEST-0002',
  purchasedAt: new Date(Date.now() - 8 * 86_400_000).toISOString(),
  isActive: false,
};

export const TICKETS_PAGE_RESPONSE = {
  items: [TICKET_ACTIVE, TICKET_PAST],
  total: 2,
  limit: 50,
  offset: 0,
};

export const TICKETS_EMPTY_RESPONSE = {
  items: [],
  total: 0,
  limit: 50,
  offset: 0,
};

// ---------------------------------------------------------------------------
// Cart (pre-seeded session state for cart/checkout tests)
// ---------------------------------------------------------------------------

export const CART_ITEM_1 = {
  seatId: SEAT_ID_AVAILABLE,
  matchId: MATCH_ID_1,
  homeTeam: 'Kecskeméti TE',
  awayTeam: 'Ferencvárosi TC',
  kickoffAt: FUTURE_KICKOFF_1,
  section: 'A',
  row: '1',
  seatNumber: 5,
  category: 'standard',
  price: 3500,
  ownerToken: OWNER_TOKEN,
  lockExpiresAtMs: Date.now() + 280_000,
  addedAtMs: Date.now() - 20_000,
};

/**
 * SessionStorage payload that pre-seeds the cart with one item.
 * Inject via page.evaluate() before navigating, e.g.:
 *   await seedCart(page, [CART_ITEM_1]);
 */
export const CART_SESSION_PAYLOAD_1 = {
  version: 1,
  matchId: MATCH_ID_1,
  items: [CART_ITEM_1],
};

// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------

export const PAYMENT_INTENT_ID = 'pi_test_000000000000001';

export const PAYMENT_INTENT_RESPONSE = {
  paymentIntentId: PAYMENT_INTENT_ID,
  clientSecret: 'pi_test_000000000000001_secret_abc',
  currency: 'huf',
  amount: 3500,
  lineItems: [
    {
      seatId: SEAT_ID_AVAILABLE,
      section: 'A',
      row: '1',
      seatNumber: 5,
      price: 3500,
    },
  ],
};

// ---------------------------------------------------------------------------
// Weather
// ---------------------------------------------------------------------------

export const WEATHER_RAIN_WARNING = {
  matchId: MATCH_ID_1,
  city: 'Kecskemét',
  forecastFor: FUTURE_KICKOFF_1,
  summary: 'Eső várható',
  temperatureCelsius: 14,
  precipitationMmPerHour: 3.2,
  precipitationProbability: 0.85,
  windSpeedMs: 5.1,
  rainWarning: true,
  icon: 'rain',
  fallback: false,
};

export const WEATHER_CLEAR = {
  matchId: MATCH_ID_1,
  city: 'Kecskemét',
  forecastFor: FUTURE_KICKOFF_1,
  summary: 'Derült',
  temperatureCelsius: 22,
  precipitationMmPerHour: 0,
  precipitationProbability: 0.05,
  windSpeedMs: 2.0,
  rainWarning: false,
  icon: 'clear',
  fallback: false,
};

// ---------------------------------------------------------------------------
// Iteration 4: Loyalty (KTE-044 / KTE-045 / KTE-046)
// ---------------------------------------------------------------------------

export const LOYALTY_TRANSACTION_1 = {
  id: 'tttttttt-0000-4000-8000-000000000001',
  points: 100,
  reason: 'Regisztrációs bónusz',
  createdAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
};

export const LOYALTY_TRANSACTION_2 = {
  id: 'tttttttt-0000-4000-8000-000000000002',
  points: 50,
  reason: 'Jegyvásárlás',
  createdAt: new Date(Date.now() - 3_600_000).toISOString(),
};

/** GET /api/loyalty/me — bronze tier user, no tier upgrade */
export const LOYALTY_ME_BRONZE = {
  totalPoints: 120,
  tier: 'bronze',
  nextTierPoints: 500,
  pointsToNextTier: 380,
  tierUpgraded: false,
  transactions: [LOYALTY_TRANSACTION_1, LOYALTY_TRANSACTION_2],
};

/** GET /api/loyalty/me — gold tier user with a fresh tier upgrade */
export const LOYALTY_ME_GOLD_UPGRADED = {
  totalPoints: 2100,
  tier: 'gold',
  nextTierPoints: 5000,
  pointsToNextTier: 2900,
  tierUpgraded: true,
  transactions: [LOYALTY_TRANSACTION_1, LOYALTY_TRANSACTION_2],
};

/** GET /api/loyalty/me — gold tier user, no upgrade */
export const LOYALTY_ME_GOLD = {
  ...LOYALTY_ME_GOLD_UPGRADED,
  tierUpgraded: false,
};

/** GET /api/loyalty/tiers */
export const LOYALTY_TIERS = [
  { tier: 'bronze', label: 'Bronz', minPoints: 0, discount: 0 },
  { tier: 'silver', label: 'Ezüst', minPoints: 500, discount: 5 },
  { tier: 'gold', label: 'Arany', minPoints: 2000, discount: 10 },
  { tier: 'platinum', label: 'Platina', minPoints: 5000, discount: 15 },
];

// ---------------------------------------------------------------------------
// Iteration 4: Auth variants for discount tests (KTE-046)
// ---------------------------------------------------------------------------

export const AUTH_USER_GOLD = {
  ...AUTH_USER,
  loyaltyTier: 'gold',
  loyaltyPoints: 2100,
};

export const AUTH_RESPONSE_GOLD = {
  ...AUTH_RESPONSE,
  user: AUTH_USER_GOLD,
};

// ---------------------------------------------------------------------------
// Iteration 4: Ticket QR endpoint (KTE-041)
// ---------------------------------------------------------------------------

export const TICKET_ID_1 = 'ffffffff-0000-4000-8000-000000000001';

/**
 * GET /api/tickets/:id/qr — returns base64 PNG data URI.
 * The actual image content does not matter for UI assertions; only the
 * img[data-testid="ticket-qr"] src attribute is validated.
 */
export const TICKET_QR_RESPONSE = {
  ticketId: TICKET_ID_1,
  qrDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
};

// ---------------------------------------------------------------------------
// Iteration 4: Season Passes & Loans (KTE-049 / KTE-051 / KTE-054)
// ---------------------------------------------------------------------------

export const SEASON_PASS_ID = 'pppppppp-0000-4000-8000-000000000001';
export const LOAN_ID = 'llllllll-0000-4000-8000-000000000001';

export const SEASON_PASS_ACTIVE = {
  id: SEASON_PASS_ID,
  matchId: null,
  seatId: SEAT_ID_AVAILABLE,
  section: 'A',
  row: '1',
  seatNumber: 5,
  validFrom: new Date(Date.now() - 90 * 86_400_000).toISOString(),
  validTo: new Date(Date.now() + 275 * 86_400_000).toISOString(),
  status: 'active',
};

export const SEASON_PASSES_RESPONSE = {
  items: [SEASON_PASS_ACTIVE],
  total: 1,
};

export const SEASON_PASSES_EMPTY_RESPONSE = {
  items: [],
  total: 0,
};

/**
 * Active loan attached to SEASON_PASS_ACTIVE — used for KTE-054 tests.
 */
export const LOAN_ACTIVE = {
  id: LOAN_ID,
  seasonPassId: SEASON_PASS_ID,
  fromUserId: USER_ID,
  toEmail: 'recipient@example.com',
  matchId: MATCH_ID_1,
  homeTeam: 'Kecskeméti TE',
  awayTeam: 'Ferencvárosi TC',
  kickoffAt: FUTURE_KICKOFF_1,
  status: 'active',
  qrDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  createdAt: new Date(Date.now() - 3_600_000).toISOString(),
};

/** POST /api/season-passes/:id/loans — successful loan creation */
export const LOAN_CREATE_RESPONSE = {
  ...LOAN_ACTIVE,
  status: 'pending',
};

/** DELETE /api/season-passes/:id/loans/:loanId — successful cancellation */
export const LOAN_CANCEL_RESPONSE = {
  ...LOAN_ACTIVE,
  status: 'cancelled',
};

export const ACTIVE_LOANS_RESPONSE = {
  items: [LOAN_ACTIVE],
  total: 1,
};

// ---------------------------------------------------------------------------
// Iteration 5: Waitlist (KTE-057)
// ---------------------------------------------------------------------------

export const WAITLIST_MATCH_SUMMARY = {
  id: MATCH_ID_1,
  homeTeam: 'Kecskeméti TE',
  awayTeam: 'Ferencvárosi TC',
  venue: 'Széktói Stadion, Kecskemét',
  kickoffAt: FUTURE_KICKOFF_1,
};

/** Active waitlist entry — user is queued, position 3 */
export const WAITLIST_ENTRY_ACTIVE = {
  id: 'wwwwwwww-0000-4000-8000-000000000001',
  matchId: MATCH_ID_1,
  status: 'active',
  requestedQuantity: 1,
  preferredSection: 'A',
  position: 3,
  peopleAhead: 2,
  createdAt: new Date(Date.now() - 10 * 60_000).toISOString(),
  notifiedAt: undefined,
  claimExpiresAt: undefined,
  match: WAITLIST_MATCH_SUMMARY,
};

/** Notified waitlist entry — a seat just became available, 5 min window */
export const WAITLIST_ENTRY_NOTIFIED = {
  id: 'wwwwwwww-0000-4000-8000-000000000002',
  matchId: MATCH_ID_1,
  status: 'notified',
  requestedQuantity: 1,
  preferredSection: 'A',
  position: 1,
  peopleAhead: 0,
  createdAt: new Date(Date.now() - 15 * 60_000).toISOString(),
  notifiedAt: new Date(Date.now() - 60_000).toISOString(),
  claimExpiresAt: new Date(Date.now() + 4 * 60_000).toISOString(),
  match: WAITLIST_MATCH_SUMMARY,
};

export const WAITLIST_ENTRY_LIST_ACTIVE = [WAITLIST_ENTRY_ACTIVE];
export const WAITLIST_ENTRY_LIST_NOTIFIED = [WAITLIST_ENTRY_NOTIFIED];
export const WAITLIST_ENTRY_LIST_EMPTY: unknown[] = [];

/** POST /waitlist — successful join response */
export const WAITLIST_JOIN_RESPONSE = {
  ...WAITLIST_ENTRY_ACTIVE,
  id: 'wwwwwwww-0000-4000-8000-000000000003',
  position: 4,
  peopleAhead: 3,
};

// ---------------------------------------------------------------------------
// Iteration 5: Chatbot (KTE-059)
// ---------------------------------------------------------------------------

export const CHATBOT_SEND_RESPONSE = {
  conversationId: 'conv-00000000-0001',
  reply: 'A következő hazai meccs 2026. május 10-én lesz a Széktói Stadionban.',
};

// ---------------------------------------------------------------------------
// Iteration 5: Admin (KTE-061, KTE-062, KTE-063)
// ---------------------------------------------------------------------------

export const AUTH_USER_ADMIN = {
  ...AUTH_USER,
  role: 'admin',
  loyaltyTier: 'bronze' as const,
  loyaltyPoints: 0,
};

export const AUTH_RESPONSE_ADMIN = {
  ...AUTH_RESPONSE,
  user: AUTH_USER_ADMIN,
};

/** GET /admin/revenue?days=30 */
export const ADMIN_REVENUE_STATS = {
  summary: {
    todayRevenue: 245_000,
    monthRevenue: 3_870_000,
    todayTicketCount: 70,
    monthTicketCount: 1106,
    topMatch: {
      matchId: MATCH_ID_1,
      homeTeam: 'Kecskeméti TE',
      awayTeam: 'Ferencvárosi TC',
      kickoffAt: FUTURE_KICKOFF_1,
      ticketCount: 421,
      revenue: 1_473_500,
    },
  },
  daily: [
    { date: '2026-04-01', amount: 105_000, ticketCount: 30 },
    { date: '2026-04-02', amount: 87_500, ticketCount: 25 },
  ],
  byMatch: [
    {
      matchId: MATCH_ID_1,
      homeTeam: 'Kecskeméti TE',
      awayTeam: 'Ferencvárosi TC',
      kickoffAt: FUTURE_KICKOFF_1,
      ticketCount: 421,
      revenue: 1_473_500,
    },
  ],
};

/** GET /admin/matches/:id/occupancy */
export const ADMIN_OCCUPANCY = {
  matchId: MATCH_ID_1,
  homeTeam: 'Kecskeméti TE',
  awayTeam: 'Ferencvárosi TC',
  kickoffAt: FUTURE_KICKOFF_1,
  venue: 'Széktói Stadion, Kecskemét',
  totalCapacity: 8200,
  totalSold: 3200,
  totalLocked: 150,
  totalAvailable: 4850,
  occupancyPercent: 41,
  generatedAt: new Date().toISOString(),
  sectors: [
    { section: 'A', total: 3000, sold: 1800, locked: 80, available: 1120, occupancyPercent: 63 },
    { section: 'B', total: 2500, sold: 800, locked: 40, available: 1660, occupancyPercent: 34 },
    { section: 'C', total: 1800, sold: 400, locked: 20, available: 1380, occupancyPercent: 24 },
    { section: 'VIP', total: 900, sold: 200, locked: 10, available: 690, occupancyPercent: 23 },
  ],
};
