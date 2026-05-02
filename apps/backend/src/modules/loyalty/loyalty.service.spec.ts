import { tierForPoints } from './loyalty.constants';
import { LoyaltyTier } from '../../database/entities';

describe('Loyalty tier promotion logic', () => {
  it('promotes a fan from BRONZE to SILVER at exactly 500 points', () => {
    expect(tierForPoints(499).tier).toBe(LoyaltyTier.BRONZE);
    expect(tierForPoints(500).tier).toBe(LoyaltyTier.SILVER);
  });

  it('promotes from SILVER to GOLD at 1500 points', () => {
    expect(tierForPoints(1499).tier).toBe(LoyaltyTier.SILVER);
    expect(tierForPoints(1500).tier).toBe(LoyaltyTier.GOLD);
  });

  it('promotes from GOLD to PLATINUM at 3000 points', () => {
    expect(tierForPoints(2999).tier).toBe(LoyaltyTier.GOLD);
    expect(tierForPoints(3000).tier).toBe(LoyaltyTier.PLATINUM);
  });
});
