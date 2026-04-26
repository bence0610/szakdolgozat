/**
 * Frontend mirror of the backend MatchListItemDto / MatchDetailDto.
 * Kept in sync manually — when the API contract changes, update this file.
 */

export type MatchStatus =
  | 'scheduled'
  | 'on_sale'
  | 'sold_out'
  | 'postponed'
  | 'cancelled'
  | 'finished';

export type Competition = 'NB1' | 'NB2' | 'magyar_kupa' | 'friendly';

export interface MatchListItem {
  readonly id: string;
  readonly homeTeam: string;
  readonly awayTeam: string;
  readonly competition: Competition;
  readonly venue: string;
  /** ISO 8601 timestamp */
  readonly kickoffAt: string;
  readonly status: MatchStatus;
  /** Forint, integer */
  readonly basePrice: number;
  readonly capacity: number;
  readonly availableSeats: number;
  readonly isHome: boolean;
  readonly bannerImageUrl?: string;
  readonly isSeasonPassEligible: boolean;
}

export interface MatchDetail extends MatchListItem {
  readonly description?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface QueryMatchesParams {
  readonly status?: MatchStatus;
  readonly from?: string;
  readonly to?: string;
  readonly limit?: number;
}
