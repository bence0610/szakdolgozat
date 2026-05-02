import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match, Ticket } from '../../database/entities';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { TicketRendererService } from './ticket-renderer.service';
import { ExpireTicketsJob } from './jobs/expire-tickets.job';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, Match]), LoyaltyModule],
  controllers: [TicketsController],
  providers: [TicketsService, TicketRendererService, ExpireTicketsJob],
  exports: [TicketsService, TicketRendererService],
})
export class TicketsModule {}
