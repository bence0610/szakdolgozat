import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match, Seat, Ticket, User } from '../../database/entities';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { TicketsModule } from '../tickets/tickets.module';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { StripeWebhookController } from './stripe-webhook.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, Match, Seat, User]),
    LoyaltyModule,
    TicketsModule,
  ],
  controllers: [CheckoutController, StripeWebhookController],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}
