export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export type LoyaltyTransactionType = 'earn' | 'redeem' | 'adjustment' | 'expiry';

export type LoyaltyTransactionSource =
  | 'ticket_purchase'
  | 'season_pass_purchase'
  | 'promotion'
  | 'reward_redeem'
  | 'admin'
  | 'profile_completion'
  | 'pass_loan'
  | 'season_carryover'
  | 'registration';

export interface LoyaltyTierResponse {
  tier: LoyaltyTier;
  label: string;
  minPoints: number;
  discountPercent: number;
  color: string;
}

export interface LoyaltyTransactionResponse {
  id: string;
  type: LoyaltyTransactionType;
  source: LoyaltyTransactionSource;
  points: number;
  balanceAfter: number;
  description?: string;
  createdAt: string;
}

export interface LoyaltySnapshotResponse {
  points: number;
  tier: LoyaltyTierResponse;
  nextTier?: LoyaltyTierResponse;
  pointsToNextTier?: number;
  recentTransactions: LoyaltyTransactionResponse[];
}

/**
 * Frontend-canonical labels and colors mirroring loyalty.constants.ts on the backend.
 * Keep this in sync if the backend tier list ever changes.
 */
export const TIER_LABELS: Record<LoyaltyTier, string> = {
  bronze: 'Kék',
  silver: 'Ezüst',
  gold: 'Arany',
  platinum: 'KTE Legenda',
};

export const TIER_COLORS: Record<LoyaltyTier, string> = {
  bronze: '#4B8EC9',
  silver: '#AAAAAA',
  gold: '#FFD700',
  platinum: '#C94B1E',
};

export const TRANSACTION_SOURCE_LABELS: Record<LoyaltyTransactionSource, string> = {
  ticket_purchase: 'Jegyvásárlás',
  season_pass_purchase: 'Bérletvásárlás',
  promotion: 'Promóció',
  reward_redeem: 'Pontbeváltás',
  admin: 'Adminisztrátori módosítás',
  profile_completion: 'Profil kitöltése',
  pass_loan: 'Bérletkölcsön',
  season_carryover: 'Szezonzáró pontkonverzió',
  registration: 'Regisztráció',
};
