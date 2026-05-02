export type WaitlistStatus =
  | 'active'
  | 'notified'
  | 'converted'
  | 'expired'
  | 'cancelled';

export interface WaitlistMatchSummary {
  readonly id: string;
  readonly homeTeam: string;
  readonly awayTeam: string;
  readonly venue: string;
  readonly kickoffAt: string;
}

export interface WaitlistEntry {
  readonly id: string;
  readonly matchId: string;
  readonly status: WaitlistStatus;
  readonly requestedQuantity: number;
  readonly preferredSection?: string;
  readonly position: number;
  readonly peopleAhead: number;
  readonly createdAt: string;
  readonly notifiedAt?: string;
  readonly claimExpiresAt?: string;
  readonly match?: WaitlistMatchSummary;
}

export interface JoinWaitlistRequest {
  readonly matchId: string;
  readonly requestedQuantity?: number;
  readonly preferredSection?: string;
}
