import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import Stripe from 'stripe';
import { DataSource, In, Repository } from 'typeorm';
import { StripeConfig } from '../../config';
import {
  Match,
  Seat,
  Ticket,
  TicketSource,
  TicketStatus,
} from '../../database/entities';
import { REDIS_CLIENT, RedisKeys } from '../../redis/redis.constants';
import { SeatLockService } from '../../redis/seat-lock.service';
import {
  CreatePaymentIntentDto,
  PaymentIntentResponseDto,
  PaymentIntentSeatDto,
  PaymentIntentSeatLineDto,
} from './dto';
import { STRIPE_CLIENT } from './stripe.provider';

interface SeatLine {
  seat: Seat;
  ownerToken: string;
  price: number;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly currency: string;
  private readonly webhookSecret: string;

  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
    @InjectRepository(Match) private readonly matchRepository: Repository<Match>,
    @InjectRepository(Seat) private readonly seatRepository: Repository<Seat>,
    @InjectRepository(Ticket) private readonly ticketRepository: Repository<Ticket>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly seatLockService: SeatLockService,
    private readonly dataSource: DataSource,
    configService: ConfigService,
  ) {
    const stripeConfig = configService.getOrThrow<StripeConfig>('stripe');
    this.currency = stripeConfig.currency;
    this.webhookSecret = stripeConfig.webhookSecret;
  }

  async createPaymentIntent(
    userId: string,
    dto: CreatePaymentIntentDto,
  ): Promise<PaymentIntentResponseDto> {
    const match = await this.matchRepository.findOne({ where: { id: dto.matchId } });
    if (!match) {
      throw new NotFoundException('Meccs nem található.');
    }

    const lines = await this.assertSeatsAvailable(dto.matchId, dto.seats, match);

    const totalAmount = lines.reduce((acc, line) => acc + line.price, 0);
    if (totalAmount <= 0) {
      throw new BadRequestException('Érvénytelen összeg.');
    }

    const idempotencyKey = `intent_${userId}_${dto.matchId}_${dto.seats
      .map((s) => s.seatId)
      .sort()
      .join('_')}`;

    const stripeAmount = this.toStripeAmount(totalAmount);
    console.log('[Stripe] PaymentIntent amount being sent:', stripeAmount, '| currency: huf');

    const intent = await this.stripe.paymentIntents.create(
      {
        amount: stripeAmount,
        currency: this.currency,
        automatic_payment_methods: { enabled: true },
        metadata: {
          userId,
          matchId: dto.matchId,
          seatIds: dto.seats.map((s) => s.seatId).join(','),
          ownerTokens: dto.seats.map((s) => s.ownerToken).join(','),
        },
        description: `KTE Jegyportál — ${match.homeTeam} vs ${match.awayTeam}`,
      },
      { idempotencyKey },
    );

    if (!intent.client_secret) {
      throw new ConflictException('A fizetési szándék nem hozott létre client_secret-et.');
    }

    const lineItems: PaymentIntentSeatLineDto[] = lines.map(({ seat, price }) => ({
      seatId: seat.id,
      section: seat.section,
      row: seat.row,
      seatNumber: seat.number,
      price,
    }));

    return {
      paymentIntentId: intent.id,
      clientSecret: intent.client_secret,
      currency: this.currency,
      amount: totalAmount,
      lineItems,
    };
  }

  /**
   * Verifies the Stripe webhook signature using the raw request body and
   * delegates handling to {@link handleEvent}.
   */
  constructEvent(rawBody: Buffer | string, signature: string | string[] | undefined): Stripe.Event {
    if (!signature) {
      throw new BadRequestException('Hiányzó Stripe-Signature fejléc.');
    }
    try {
      return this.stripe.webhooks.constructEvent(
        rawBody,
        Array.isArray(signature) ? signature[0] : signature,
        this.webhookSecret,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`Webhook signature verification failed: ${message}`);
      throw new BadRequestException(`Érvénytelen webhook aláírás: ${message}`);
    }
  }

  async handleEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'charge.dispute.created':
        this.logger.warn(`Dispute opened: ${event.id}`);
        break;
      default:
        this.logger.debug(`Ignoring Stripe event ${event.type}`);
    }
  }

  /**
   * Idempotently turn a successful PaymentIntent into Ticket rows and release
   * the corresponding Redis locks.
   */
  private async handlePaymentSuccess(intent: Stripe.PaymentIntent): Promise<void> {
    const userId = intent.metadata.userId;
    const matchId = intent.metadata.matchId;
    const seatIds = (intent.metadata.seatIds ?? '').split(',').filter(Boolean);
    const ownerTokens = (intent.metadata.ownerTokens ?? '').split(',').filter(Boolean);

    if (!userId || !matchId || seatIds.length === 0) {
      this.logger.error(
        `payment_intent.succeeded missing metadata: ${JSON.stringify(intent.metadata)}`,
      );
      return;
    }

    const existing = await this.ticketRepository.find({
      where: { stripePaymentIntentId: intent.id },
      select: ['id'],
    });
    if (existing.length > 0) {
      this.logger.log(`PaymentIntent ${intent.id} already produced tickets — skipping.`);
      return;
    }

    const match = await this.matchRepository.findOne({ where: { id: matchId } });
    if (!match) {
      this.logger.error(`PaymentIntent ${intent.id} references missing match ${matchId}`);
      return;
    }

    const seats = await this.seatRepository.find({ where: { id: In(seatIds) } });
    const seatById = new Map(seats.map((s) => [s.id, s]));
    const basePrice = Number(match.basePrice);

    await this.dataSource.transaction(async (em) => {
      for (const seatId of seatIds) {
        const seat = seatById.get(seatId);
        if (!seat) {
          this.logger.error(`Seat ${seatId} missing while finalizing payment ${intent.id}`);
          continue;
        }
        const price = Math.round(basePrice * Number(seat.priceModifier));
        const ticket = em.create(Ticket, {
          matchId,
          seatId,
          userId,
          status: TicketStatus.PAID,
          source: TicketSource.SINGLE,
          pricePaid: price.toFixed(2),
          currency: 'HUF',
          qrCode: `KTE-${randomUUID()}`,
          stripePaymentIntentId: intent.id,
        });
        await em.save(Ticket, ticket);
      }
    });

    // Release any seat lock the buyer owned.
    await Promise.all(
      seatIds.map((seatId, idx) => {
        const ownerToken = ownerTokens[idx];
        if (!ownerToken) {
          return Promise.resolve(false);
        }
        return this.seatLockService.release(matchId, seatId, ownerToken);
      }),
    );

    if (userId) {
      await this.redis.del(RedisKeys.seatLockOwner(matchId, userId));
    }

    this.logger.log(
      `Finalized payment ${intent.id}: created ${seatIds.length} ticket(s) for user ${userId}.`,
    );
  }

  private async handlePaymentFailed(intent: Stripe.PaymentIntent): Promise<void> {
    const matchId = intent.metadata.matchId;
    const seatIds = (intent.metadata.seatIds ?? '').split(',').filter(Boolean);
    const ownerTokens = (intent.metadata.ownerTokens ?? '').split(',').filter(Boolean);
    if (!matchId || seatIds.length === 0) {
      return;
    }

    // KTE-037: extend each seat lock by 120 seconds so the user can retry.
    await Promise.all(
      seatIds.map((seatId, idx) => {
        const ownerToken = ownerTokens[idx];
        if (!ownerToken) {
          return Promise.resolve(false);
        }
        return this.seatLockService.extend(matchId, seatId, ownerToken, 120);
      }),
    );
    this.logger.warn(
      `payment_intent.payment_failed ${intent.id} — extended ${seatIds.length} seat lock(s) by 120s.`,
    );
  }

  /**
   * Validates that every seat in the request is still locked by the caller,
   * not yet sold, and resolves their server-authoritative price.
   */
  private async assertSeatsAvailable(
    matchId: string,
    requested: PaymentIntentSeatDto[],
    match: Match,
  ): Promise<SeatLine[]> {
    const seats = await this.seatRepository.find({
      where: { id: In(requested.map((r) => r.seatId)) },
    });
    if (seats.length !== requested.length) {
      throw new BadRequestException('Egy vagy több szék nem található.');
    }

    const soldTickets = await this.ticketRepository.find({
      where: {
        matchId,
        seatId: In(requested.map((r) => r.seatId)),
        status: In([TicketStatus.PAID, TicketStatus.PENDING_PAYMENT]),
      },
      select: ['seatId'],
    });
    if (soldTickets.length > 0) {
      throw new ConflictException('Egy vagy több szék már elkelt.');
    }

    const lines: SeatLine[] = [];
    const basePrice = Number(match.basePrice);
    for (const item of requested) {
      const seat = seats.find((s) => s.id === item.seatId);
      if (!seat) {
        throw new BadRequestException(`Szék nem található: ${item.seatId}`);
      }

      const lockKey = RedisKeys.seatLock(matchId, item.seatId);
      const stored = await this.redis.get(lockKey);
      if (!stored) {
        throw new ConflictException(
          `A szék zárolása lejárt (${seat.section}-${seat.row}-${seat.number}).`,
        );
      }
      if (stored !== item.ownerToken) {
        throw new ConflictException(
          `A szék zárolása már másé (${seat.section}-${seat.row}-${seat.number}).`,
        );
      }

      const modifier = Number(seat.priceModifier);
      const price = Math.round(basePrice * modifier);
      console.log('[Checkout] base_price:', basePrice, '| price_modifier:', modifier, '| unitPrice:', price);
      lines.push({ seat, ownerToken: item.ownerToken, price });
    }
    return lines;
  }

  private toStripeAmount(huf: number): number {
    // Stripe's API treats HUF as a 2-decimal currency (smallest unit = fillér),
    // even though HUF is real-life zero-decimal. A 6 750 HUF charge must be
    // submitted as 675 000. Without the * 100 conversion Stripe interprets the
    // value as 67.50 HUF and rejects it (minimum charge is 175 HUF).
    return Math.round(huf) * 100;
  }
}
