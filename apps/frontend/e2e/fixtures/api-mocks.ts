/**
 * Canonical API mock payloads for Iteration 2 E2E tests.
 *
 * Keeping all fixtures in one place makes it trivial to update them when
 * the DTOs change — test files import from here instead of defining
 * inline payloads.
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
