import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import Stripe from 'stripe';
import { nanoid } from 'nanoid';
import {
  Match,
  Seat,
  Ticket,
  TicketSource,
  TicketStatus,
  User,
} from '../../database/entities';
import { StripeConfig } from '../../config';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { QrService } from '../qr/qr.service';
import {
  CreatePaymentIntentDto,
  CreatePaymentIntentResponseDto,
} from './dto/create-payment-intent.dto';

/**
 * Coordinates the Stripe PaymentIntent creation for ticket purchases.
 *
 * Loyalty-tier discounts are applied at this layer (KTE-046):
 *   - The Ticket.pricePaid column always stores the original list price.
 *   - The Stripe PaymentIntent.amount is the discounted total.
 *   - The discount % is recorded on PaymentIntent.metadata for reconciliation.
 */
@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);
  private readonly stripe: Stripe;
  private readonly stripeConfig: StripeConfig;

  constructor(
    @InjectRepository(Match) private readonly matchRepository: Repository<Match>,
    @InjectRepository(Seat) private readonly seatRepository: Repository<Seat>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly loyaltyService: LoyaltyService,
    private readonly qrService: QrService,
  ) {
    this.stripeConfig = this.configService.getOrThrow<StripeConfig>('stripe');
    this.stripe = new Stripe(this.stripeConfig.secretKey, {
      apiVersion: '2024-06-20' as Stripe.LatestApiVersion,
      typescript: true,
    });
  }

  async createPaymentIntent(
    userId: string,
    dto: CreatePaymentIntentDto,
  ): Promise<CreatePaymentIntentResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    if (dto.items.length === 0) {
      throw new BadRequestException('No items provided');
    }

    const matchIds = Array.from(new Set(dto.items.map((i) => i.matchId)));
    const seatIds = Array.from(new Set(dto.items.map((i) => i.seatId)));

    const matches = await this.matchRepository.find({ where: { id: In(matchIds) } });
    const seats = await this.seatRepository.find({ where: { id: In(seatIds) } });
    if (matches.length !== matchIds.length || seats.length !== seatIds.length) {
      throw new NotFoundException('One or more matches or seats not found');
    }
    const matchById = new Map(matches.map((m) => [m.id, m] as const));
    const seatById = new Map(seats.map((s) => [s.id, s] as const));

    // Sanity: prevent duplicates in the same checkout
    const seenComposite = new Set<string>();
    for (const item of dto.items) {
      const key = `${item.matchId}:${item.seatId}`;
      if (seenComposite.has(key)) {
        throw new BadRequestException(`Duplicate ticket in cart: ${key}`);
      }
      seenComposite.add(key);
    }

    const discountPercent = this.loyaltyService.getDiscountPercentForTier(user.loyaltyTier);

    return this.dataSource.transaction(async (manager) => {
      const ticketRepo = manager.getRepository(Ticket);

      let originalTotalMajor = 0;
      const tickets: Ticket[] = [];
      for (const item of dto.items) {
        const match = matchById.get(item.matchId);
        const seat = seatById.get(item.seatId);
        if (!match || !seat) {
          throw new NotFoundException('Match or seat missing');
        }
        const basePrice = Number.parseFloat(match.basePrice);
        const modifier = Number.parseFloat(seat.priceModifier);
        // HUF is a real-life zero-decimal currency, but Stripe's API treats
        // HUF as a 2-decimal currency (smallest unit = fillér). The major-unit
        // forint amount is stored on the Ticket and shown in the UI; the * 100
        // conversion to minor units happens when building the PaymentIntent.
        const unitPrice = Math.round(basePrice * modifier);
        console.log('[Checkout] base_price:', basePrice, '| price_modifier:', modifier, '| unitPrice:', unitPrice);
        originalTotalMajor += unitPrice;

        const ticket = ticketRepo.create({
          matchId: match.id,
          seatId: seat.id,
          userId,
          status: TicketStatus.PENDING_PAYMENT,
          source: TicketSource.SINGLE,
          pricePaid: unitPrice.toFixed(2),
          currency: 'HUF',
          qrCode: nanoid(48),
          qrJti: this.qrService.generateJti(),
        });
        tickets.push(ticket);
      }

      // Convert HUF (forint, major unit) to Stripe minor units (fillér).
      // Stripe's API treats HUF as a 2-decimal currency, so 6 750 HUF must
      // be sent as 675 000. The originalMajor / discountedMajor values are
      // returned to the frontend (cart UI) and persisted as ticket.pricePaid.
      const originalMajor = Math.round(originalTotalMajor);
      const discountedMajor = Math.round((originalTotalMajor * (100 - discountPercent)) / 100);
      const discountAmount = originalMajor - discountedMajor;
      const stripeAmount = discountedMajor * 100;

      console.log('[Stripe] PaymentIntent amount being sent:', stripeAmount, '| currency: huf');

      const intent = await this.stripe.paymentIntents.create(
        {
          amount: stripeAmount,
          currency: this.stripeConfig.currency,
          automatic_payment_methods: { enabled: true },
          metadata: {
            userId,
            originalAmount: String(originalMajor),
            discountPercent: String(discountPercent),
            discountAmount: String(discountAmount),
            ticketCount: String(tickets.length),
          },
        },
        {
          idempotencyKey: `pi:${userId}:${[...seenComposite].sort().join('|')}`,
        },
      );

      for (const ticket of tickets) {
        ticket.stripePaymentIntentId = intent.id;
      }
      const saved = await ticketRepo.save(tickets);

      this.logger.log(
        `PaymentIntent ${intent.id} created user=${userId} tickets=${saved.length} amount_huf=${discountedMajor} stripe_amount=${stripeAmount} discount=${discountPercent}%`,
      );

      return {
        paymentIntentId: intent.id,
        clientSecret: intent.client_secret ?? '',
        amount: discountedMajor,
        originalAmount: originalMajor,
        discountAmount,
        discountPercent,
        currency: this.stripeConfig.currency.toUpperCase(),
        ticketIds: saved.map((t) => t.id),
      };
    });
  }

  /** Returns a configured Stripe SDK instance for webhook signature verification. */
  getStripe(): Stripe {
    return this.stripe;
  }

  getWebhookSecret(): string {
    return this.stripeConfig.webhookSecret;
  }
}
