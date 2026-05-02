import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { LoyaltyConfig } from '../../../config';
import { LoyaltyTransactionSource, LoyaltyTransactionType, User } from '../../../database/entities';
import { LoyaltyService } from '../loyalty.service';
import { tierForPoints } from '../loyalty.constants';

/**
 * Runs once a year on June 30 at 03:00 Europe/Budapest. For every user, the
 * outstanding points balance is reduced to LOYALTY_CARRYOVER_PERCENT% (the
 * remainder is logged as an EXPIRY transaction so the audit trail stays clean).
 *
 * Tier is recomputed as part of the same database transaction.
 */
@Injectable()
export class SeasonCarryoverJob {
  private readonly logger = new Logger(SeasonCarryoverJob.name);
  private readonly loyaltyConfig: LoyaltyConfig;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly loyaltyService: LoyaltyService,
  ) {
    this.loyaltyConfig = this.configService.getOrThrow<LoyaltyConfig>('loyalty');
  }

  @Cron('0 3 30 6 *', { timeZone: 'Europe/Budapest', name: 'loyaltySeasonCarryover' })
  async run(): Promise<void> {
    const carryoverPercent = this.loyaltyConfig.carryoverPercent;
    const seasonStamp = new Date().toISOString().slice(0, 10);
    this.logger.log(`Season-end carryover starting (carryover=${carryoverPercent}%)`);

    const userRepo = this.dataSource.getRepository(User);
    const users = await userRepo.find({ where: { isActive: true } });

    let processed = 0;
    let skipped = 0;
    for (const user of users) {
      if (user.loyaltyPoints <= 0) {
        continue;
      }
      const expiringPoints = Math.floor((user.loyaltyPoints * (100 - carryoverPercent)) / 100);
      if (expiringPoints <= 0) {
        skipped += 1;
        continue;
      }
      try {
        const referenceId = `season:${seasonStamp}:${user.id}`;
        await this.loyaltyService.award({
          userId: user.id,
          type: LoyaltyTransactionType.EXPIRY,
          source: LoyaltyTransactionSource.SEASON_CARRYOVER,
          points: -expiringPoints,
          referenceId,
          description: `Szezonzáró pontkonverzió (${carryoverPercent}% megtartva)`,
        });
        processed += 1;
      } catch (error) {
        this.logger.error(`Carryover failed for user ${user.id}: ${(error as Error).message}`);
      }
    }
    this.logger.log(`Season-end carryover finished. processed=${processed} skipped=${skipped}`);

    // Sanity: ensure tier is in sync (in case of any data drift)
    const drift = await userRepo.find({ where: { isActive: true } });
    for (const user of drift) {
      const expected = tierForPoints(user.loyaltyPoints).tier;
      if (expected !== user.loyaltyTier) {
        await userRepo.update({ id: user.id }, { loyaltyTier: expected });
      }
    }
  }
}
