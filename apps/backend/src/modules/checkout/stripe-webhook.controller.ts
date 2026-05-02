import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';
import Stripe from 'stripe';
import { CheckoutService } from './checkout.service';
import { TicketsService } from '../tickets/tickets.service';

/**
 * Receives Stripe webhook callbacks. Mounted at /api/webhooks/stripe so the
 * raw-body middleware (registered in main.ts for this exact path) preserves
 * the body for signature verification.
 */
@ApiExcludeController()
@Controller('webhooks/stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly checkoutService: CheckoutService,
    private readonly ticketsService: TicketsService,
  ) {}

  @Post()
  @HttpCode(200)
  async handle(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: true }> {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }
    if (!req.rawBody) {
      throw new BadRequestException('Raw body not available; check middleware setup');
    }

    let event: Stripe.Event;
    try {
      event = this.checkoutService.getStripe().webhooks.constructEvent(
        req.rawBody,
        signature,
        this.checkoutService.getWebhookSecret(),
      );
    } catch (error) {
      this.logger.error(`Stripe signature verification failed: ${(error as Error).message}`);
      throw new BadRequestException('Invalid Stripe signature');
    }

    this.logger.log(`Stripe event received: ${event.type} id=${event.id}`);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent;
        try {
          await this.ticketsService.finalizePaidPaymentIntent(intent.id);
        } catch (error) {
          this.logger.error(
            `payment_intent.succeeded handling failed pi=${intent.id}: ${(error as Error).message}`,
            (error as Error).stack,
          );
          throw error;
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        this.logger.warn(`PaymentIntent failed pi=${intent.id} reason=${intent.last_payment_error?.message ?? 'unknown'}`);
        break;
      }
      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        this.logger.warn(`Dispute opened charge=${dispute.charge as string} reason=${dispute.reason}`);
        break;
      }
      default:
        this.logger.debug(`Unhandled Stripe event type=${event.type}`);
    }

    return { received: true };
  }
}
