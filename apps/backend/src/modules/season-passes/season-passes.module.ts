import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match, PassLoan, SeasonPass, User } from '../../database/entities';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { TicketsModule } from '../tickets/tickets.module';
import { SeasonPassesController } from './season-passes.controller';
import { SeasonPassesService } from './season-passes.service';
import { LoanReleaseJob } from './jobs/loan-release.job';

@Module({
  imports: [
    TypeOrmModule.forFeature([SeasonPass, PassLoan, Match, User]),
    LoyaltyModule,
    TicketsModule,
  ],
  controllers: [SeasonPassesController],
  providers: [SeasonPassesService, LoanReleaseJob],
  exports: [SeasonPassesService],
})
export class SeasonPassesModule {}
