import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import {
  LoyaltyTransactionSource,
  LoyaltyTransactionType,
  Match,
  Ticket,
  TicketStatus,
} from '../../database/entities';
import { LoyaltyConfig, MailConfig } from '../../config';
import { EmailService } from '../email/email.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { QrService } from '../qr/qr.service';
import { TicketRendererService } from './ticket-renderer.service';
import { TicketScanResponseDto } from './dto/scan-ticket.dto';
import { WaitlistNotificationService } from '../waitlist/waitlist-notification.service';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);
  private readonly loyaltyConfig: LoyaltyConfig;
  private readonly mailConfig: MailConfig;

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly qrService: QrService,
    private readonly emailService: EmailService,
    private readonly loyaltyService: LoyaltyService,
    private readonly renderer: TicketRendererService,
    private readonly configService: ConfigService,
    @Optional()
    @Inject(forwardRef(() => WaitlistNotificationService))
    private readonly waitlistNotifier?: WaitlistNotificationService,
  ) {
    this.loyaltyConfig = this.configService.getOrThrow<LoyaltyConfig>('loyalty');
    this.mailConfig = this.configService.getOrThrow<MailConfig>('mail');
  }

  async count(): Promise<number> {
    return this.ticketRepository.count();
  }

  async findForUser(userId: string): Promise<Ticket[]> {
    return this.ticketRepository.find({
      where: { userId },
      relations: ['match', 'seat'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(ticketId: string, userId?: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['match', 'seat'],
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }
    if (userId && ticket.userId !== userId) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }
    return ticket;
  }

  /**
   * Generates the QR data URL for a ticket. Used by the user dashboard.
   *
   * The token includes the persisted `qr_jti` so a leaked old token can be
   * rotated (admin can simply update qr_jti on the row to invalidate it).
   */
  async getQrForOwner(ticketId: string, userId: string): Promise<string> {
    const ticket = await this.findById(ticketId, userId);
    if (ticket.status !== TicketStatus.PAID && ticket.status !== TicketStatus.USED) {
      throw new BadRequestException(`Ticket ${ticketId} is not in a presentable state`);
    }
    const result = await this.qrService.generateForTicket(ticket.id, ticket.qrJti);
    return result.dataUrl;
  }

  /**
   * Marks a paid ticket as USED. Idempotent for repeat scans of the same
   * ticket (returns `already_used` instead of throwing).
   *
   * Optional `token` parameter validates the JWT QR before allowing the
   * scan to mutate state. If provided and invalid, the scan is rejected.
   */
  async scanTicket(
    ticketId: string,
    options: { token?: string; scannedByUserId?: string },
  ): Promise<TicketScanResponseDto> {
    if (options.token) {
      const verification = await this.qrService.verify(options.token, 'ticket');
      if (!verification.valid || verification.payload?.sub !== ticketId) {
        return {
          success: false,
          result: 'invalid',
          message: verification.reason ?? 'invalid_token',
        };
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const ticketRepo = manager.getRepository(Ticket);
      const ticket = await ticketRepo.findOne({
        where: { id: ticketId },
        relations: ['match'],
      });
      if (!ticket) {
        return { success: false, result: 'invalid', message: 'ticket_not_found' };
      }
      if (ticket.status === TicketStatus.USED) {
        return {
          success: false,
          result: 'already_used',
          ticketId: ticket.id,
          scannedAt: ticket.scannedAt?.toISOString(),
        };
      }
      if (ticket.status === TicketStatus.EXPIRED) {
        return { success: false, result: 'expired', ticketId: ticket.id };
      }
      if (ticket.status !== TicketStatus.PAID) {
        return {
          success: false,
          result: 'invalid',
          ticketId: ticket.id,
          message: `ticket_status_${ticket.status}`,
        };
      }
      const now = new Date();
      ticket.status = TicketStatus.USED;
      ticket.usedAt = now;
      ticket.scannedAt = now;
      ticket.scannedByUserId = options.scannedByUserId;
      await ticketRepo.save(ticket);
      if (ticket.qrJti) {
        await this.qrService.revoke(ticket.qrJti);
      }
      return {
        success: true,
        result: 'ok',
        ticketId: ticket.id,
        scannedAt: now.toISOString(),
      };
    });
  }

  /**
   * Cancels or refunds a ticket. The seat returns to the available pool, so
   * the next person on the match's waitlist (if any) is notified.
   *
   * Designed to be safe to call from admin tooling and from Stripe refund
   * webhooks — idempotent for repeated calls.
   */
  async cancelTicket(
    ticketId: string,
    options: { reason: 'refunded' | 'cancelled'; actorUserId?: string } = { reason: 'cancelled' },
  ): Promise<Ticket> {
    const ticket = await this.dataSource.transaction(async (manager) => {
      const ticketRepo = manager.getRepository(Ticket);
      const found = await ticketRepo.findOne({ where: { id: ticketId } });
      if (!found) {
        throw new NotFoundException(`Ticket ${ticketId} not found`);
      }
      if (found.status === TicketStatus.CANCELLED || found.status === TicketStatus.REFUNDED) {
        return found;
      }
      found.status = options.reason === 'refunded' ? TicketStatus.REFUNDED : TicketStatus.CANCELLED;
      await ticketRepo.save(found);
      if (found.qrJti) {
        await this.qrService.revoke(found.qrJti).catch(() => undefined);
      }
      return found;
    });

    this.logger.log(
      `Ticket ${ticketId} -> ${ticket.status} by actor=${options.actorUserId ?? 'system'}`,
    );

    // Best-effort: invite the next waitlist member.
    if (this.waitlistNotifier) {
      void this.waitlistNotifier.notifyNextInLine(ticket.matchId).catch((error: unknown) => {
        this.logger.error(
          `notifyNextInLine after cancel(${ticketId}) failed: ${(error as Error).message}`,
        );
      });
    }

    return ticket;
  }

  /**
   * Hook called by the Stripe webhook handler when a payment_intent succeeds.
   * Marks all matching tickets as PAID, awards loyalty points, and dispatches
   * the confirmation email. Designed to be safe to call multiple times -
   * everything is idempotent.
   */
  async finalizePaidPaymentIntent(paymentIntentId: string): Promise<void> {
    const tickets = await this.ticketRepository.find({
      where: { stripePaymentIntentId: paymentIntentId },
      relations: ['match', 'seat', 'user'],
    });
    if (tickets.length === 0) {
      this.logger.warn(`No tickets found for paymentIntent=${paymentIntentId}; ignoring webhook.`);
      return;
    }

    await this.dataSource.transaction(async (manager) => {
      const ticketRepo = manager.getRepository(Ticket);
      for (const ticket of tickets) {
        if (ticket.status === TicketStatus.PENDING_PAYMENT) {
          ticket.status = TicketStatus.PAID;
          if (!ticket.qrJti) {
            ticket.qrJti = this.qrService.generateJti();
          }
          await ticketRepo.save(ticket);
        }
      }
    });

    // Award loyalty points (one transaction per ticket; idempotent via referenceId).
    for (const ticket of tickets) {
      try {
        await this.loyaltyService.award({
          userId: ticket.userId,
          type: LoyaltyTransactionType.EARN,
          source: LoyaltyTransactionSource.TICKET_PURCHASE,
          points: this.loyaltyConfig.ticketPointsPerTicket,
          referenceId: `ticket:${ticket.id}`,
          description: `Jegyvásárlás: ${ticket.match?.homeTeam ?? ''} - ${ticket.match?.awayTeam ?? ''}`,
        });
      } catch (error) {
        this.logger.error(
          `Loyalty award failed for ticket=${ticket.id}: ${(error as Error).message}`,
        );
      }
    }

    // Group by user (multi-ticket purchases) so each buyer gets one email.
    const grouped = new Map<string, Ticket[]>();
    for (const t of tickets) {
      const list = grouped.get(t.userId) ?? [];
      list.push(t);
      grouped.set(t.userId, list);
    }

    for (const [userId, userTickets] of grouped) {
      const userTicket = userTickets[0];
      if (!userTicket.user || !userTicket.match) {
        continue;
      }
      // Idempotency guard
      const refresh = await this.ticketRepository.find({
        where: { id: In(userTickets.map((t) => t.id)) },
      });
      const alreadySent = refresh.some(
        (t) => t.confirmationEmailSentAt !== null && t.confirmationEmailSentAt !== undefined,
      );
      if (alreadySent) {
        this.logger.log(`Confirmation email skipped (already sent) user=${userId}`);
        continue;
      }
      void this.dispatchConfirmationEmail(userTickets).catch((error: Error) => {
        this.logger.error(`Confirmation email dispatch failed user=${userId}: ${error.message}`);
      });
    }
  }

  private async dispatchConfirmationEmail(tickets: Ticket[]): Promise<void> {
    const userTicket = tickets[0];
    if (!userTicket.user || !userTicket.match) {
      throw new Error('User or match relation missing on ticket');
    }
    const matchSummary = this.renderer.matchSummary(userTicket.match as Match);
    const sections = tickets.map((t) => this.renderer.renderTicketSection(t));
    const qrImageDataUrls = await Promise.all(
      tickets.map(async (t) => {
        const result = await this.qrService.generateForTicket(t.id, t.qrJti);
        return {
          ticketId: t.id,
          seatLabel: t.seat ? this.renderer.formatSeat(t.seat) : '',
          dataUrl: result.dataUrl,
        };
      }),
    );

    await this.emailService.send({
      to: userTicket.user.email,
      subject: `Jegy visszaigazolás - ${matchSummary.title}`,
      template: 'ticket-confirmation',
      context: {
        recipientName: userTicket.user.firstName,
        matchTitle: matchSummary.title,
        matchVenue: matchSummary.venue,
        matchKickoffLabel: matchSummary.kickoffLabel,
        tickets: sections,
        totalLabel: this.renderer.computeTotal(tickets),
        ticketsUrl: `${this.mailConfig.baseUrl}/profile`,
        qrImageDataUrls,
      },
      correlationId: `ticket-confirmation:${userTicket.stripePaymentIntentId ?? userTicket.id}`,
    });

    const sentAt = new Date();
    await this.ticketRepository
      .createQueryBuilder()
      .update(Ticket)
      .set({ confirmationEmailSentAt: sentAt })
      .whereInIds(tickets.map((t) => t.id))
      .execute();
  }
}
