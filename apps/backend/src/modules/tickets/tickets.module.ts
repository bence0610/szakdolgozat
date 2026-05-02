import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match, Ticket } from '../../database/entities';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { WaitlistModule } from '../waitlist/waitlist.module';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { TicketRendererService } from './ticket-renderer.service';
import { ExpireTicketsJob } from './jobs/expire-tickets.job';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, Match]),
    LoyaltyModule,
    forwardRef(() => WaitlistModule),
  ],
  controllers: [TicketsController],
  providers: [TicketsService, TicketRendererService, ExpireTicketsJob],
  exports: [TicketsService, TicketRendererService],
})
export class TicketsModule {}
