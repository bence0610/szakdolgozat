import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltyTransaction, User } from '../../database/entities';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyService } from './loyalty.service';
import { SeasonCarryoverJob } from './jobs/season-carryover.job';

@Module({
  imports: [TypeOrmModule.forFeature([LoyaltyTransaction, User])],
  controllers: [LoyaltyController],
  providers: [LoyaltyService, SeasonCarryoverJob],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
