import { LoyaltyTier } from '../../database/entities';
import { definitionFor, tierForPoints, TIER_DEFINITIONS } from './loyalty.constants';

describe('LoyaltyConstants', () => {
  it('returns BRONZE for any points below the silver threshold', () => {
    expect(tierForPoints(0).tier).toBe(LoyaltyTier.BRONZE);
    expect(tierForPoints(499).tier).toBe(LoyaltyTier.BRONZE);
  });

  it('returns SILVER between 500 and 1499 points', () => {
    expect(tierForPoints(500).tier).toBe(LoyaltyTier.SILVER);
    expect(tierForPoints(1499).tier).toBe(LoyaltyTier.SILVER);
  });

  it('returns GOLD between 1500 and 2999 points', () => {
    expect(tierForPoints(1500).tier).toBe(LoyaltyTier.GOLD);
    expect(tierForPoints(2999).tier).toBe(LoyaltyTier.GOLD);
  });

  it('returns PLATINUM at 3000+ points', () => {
    expect(tierForPoints(3000).tier).toBe(LoyaltyTier.PLATINUM);
    expect(tierForPoints(50_000).tier).toBe(LoyaltyTier.PLATINUM);
  });

  it('exposes a definition for every tier value', () => {
    for (const tier of Object.values(LoyaltyTier)) {
      expect(definitionFor(tier).tier).toBe(tier);
    }
    expect(TIER_DEFINITIONS).toHaveLength(4);
  });

  it('discount percent rises monotonically with tier', () => {
    const percents = TIER_DEFINITIONS.map((t) => t.discountPercent);
    for (let i = 1; i < percents.length; i += 1) {
      expect(percents[i]).toBeGreaterThanOrEqual(percents[i - 1]);
    }
  });
});
