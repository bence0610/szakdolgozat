export type SeasonPassStatus = 'active' | 'expired' | 'cancelled' | 'pending_payment';
export type PassLoanStatus =
  | 'pending'
  | 'accepted'
  | 'revoked'
  | 'expired'
  | 'used'
  | 'cancelled'
  | 'completed';

export interface PassLoanResponse {
  id: string;
  status: PassLoanStatus;
  borrowerEmail: string;
  borrowerUserId?: string;
  matchId: string;
  matchTitle?: string;
  kickoffAt?: string;
  expiresAt: string;
  createdAt: string;
  acceptedAt?: string;
  cancelledAt?: string;
  completedAt?: string;
}

export interface SeasonPassResponse {
  id: string;
  status: SeasonPassStatus;
  seasonLabel: string;
  validFrom: string;
  validUntil: string;
  seatLabel?: string;
  loans: PassLoanResponse[];
}

export const PASS_LOAN_STATUS_LABELS: Record<PassLoanStatus, string> = {
  pending: 'Visszaigazolásra vár',
  accepted: 'Elfogadva',
  revoked: 'Visszavonva',
  expired: 'Lejárt',
  used: 'Felhasznált',
  cancelled: 'Visszavont',
  completed: 'Lezárt',
};
