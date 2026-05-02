import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { nanoid } from 'nanoid';
import {
  LoyaltyTransactionSource,
  LoyaltyTransactionType,
  Match,
  PassLoan,
  PassLoanStatus,
  SeasonPass,
  SeasonPassStatus,
  User,
} from '../../database/entities';
import { CronConfig, MailConfig } from '../../config';
import { EmailService } from '../email/email.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { QrService } from '../qr/qr.service';
import { TicketRendererService } from '../tickets/ticket-renderer.service';
import { CancelLoanDto, CreateLoanDto } from './dto/create-loan.dto';

@Injectable()
export class SeasonPassesService {
  private readonly logger = new Logger(SeasonPassesService.name);
  private readonly mailConfig: MailConfig;
  private readonly cronConfig: CronConfig;

  constructor(
    @InjectRepository(SeasonPass) private readonly seasonPassRepository: Repository<SeasonPass>,
    @InjectRepository(PassLoan) private readonly passLoanRepository: Repository<PassLoan>,
    @InjectRepository(Match) private readonly matchRepository: Repository<Match>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly qrService: QrService,
    private readonly loyaltyService: LoyaltyService,
    private readonly renderer: TicketRendererService,
  ) {
    this.mailConfig = this.configService.getOrThrow<MailConfig>('mail');
    this.cronConfig = this.configService.getOrThrow<CronConfig>('cron');
  }

  async listForUser(userId: string): Promise<Array<{ pass: SeasonPass; loans: PassLoan[]; seat: string | undefined }>> {
    const passes = await this.seasonPassRepository.find({
      where: { userId },
      relations: ['seat'],
      order: { validFrom: 'DESC' },
    });
    if (passes.length === 0) {
      return [];
    }
    const loans = await this.passLoanRepository.find({
      where: { seasonPassId: In(passes.map((p) => p.id)) },
      relations: ['match'],
      order: { createdAt: 'DESC' },
    });
    return passes.map((pass) => ({
      pass,
      loans: loans.filter((l) => l.seasonPassId === pass.id),
      seat: pass.seat ? this.renderer.formatSeat(pass.seat) : undefined,
    }));
  }

  async getOwnedPass(passId: string, userId: string): Promise<SeasonPass> {
    const pass = await this.seasonPassRepository.findOne({
      where: { id: passId },
      relations: ['seat'],
    });
    if (!pass) {
      throw new NotFoundException(`Season pass ${passId} not found`);
    }
    if (pass.userId !== userId) {
      throw new ForbiddenException('Not the owner of this season pass');
    }
    return pass;
  }

  async createLoan(passId: string, lenderUserId: string, dto: CreateLoanDto): Promise<PassLoan> {
    const pass = await this.getOwnedPass(passId, lenderUserId);
    if (pass.status !== SeasonPassStatus.ACTIVE) {
      throw new BadRequestException('Season pass is not active');
    }

    const lender = await this.userRepository.findOne({ where: { id: lenderUserId } });
    if (!lender) {
      throw new NotFoundException('Lender user not found');
    }
    if (lender.email.toLowerCase() === dto.borrowerEmail.toLowerCase()) {
      throw new BadRequestException('Cannot loan to yourself');
    }

    const match = await this.matchRepository.findOne({ where: { id: dto.matchId } });
    if (!match) {
      throw new NotFoundException('Match not found');
    }
    if (match.kickoffAt.getTime() < Date.now()) {
      throw new BadRequestException('Cannot create a loan for a match that has already started');
    }

    // Reject overlapping pending/accepted loans for the same match.
    const existing = await this.passLoanRepository.findOne({
      where: {
        seasonPassId: passId,
        matchId: dto.matchId,
        status: In([PassLoanStatus.PENDING, PassLoanStatus.ACCEPTED]),
      },
    });
    if (existing) {
      throw new BadRequestException('This pass is already loaned for this match');
    }

    const borrower = await this.userRepository.findOne({
      where: { email: dto.borrowerEmail.toLowerCase() },
    });

    const loan = this.passLoanRepository.create({
      seasonPassId: pass.id,
      lenderUserId,
      borrowerUserId: borrower?.id,
      borrowerEmail: dto.borrowerEmail.toLowerCase(),
      matchId: dto.matchId,
      status: PassLoanStatus.PENDING,
      invitationToken: nanoid(48),
      expiresAt: new Date(Date.now() + this.cronConfig.loanInvitationTtlHours * 60 * 60 * 1000),
    });
    const saved = await this.passLoanRepository.save(loan);

    void this.dispatchInvitationEmail(saved, lender, match, pass).catch((error: Error) => {
      this.logger.error(`Loan invitation email failed for loan=${saved.id}: ${error.message}`);
    });

    return saved;
  }

  /**
   * Borrower-side acceptance flow.
   * Generates the QR token (jti persisted on the loan row for rotation).
   */
  async acceptLoan(invitationToken: string, borrowerUserId: string): Promise<PassLoan> {
    return this.dataSource.transaction(async (manager) => {
      const loanRepo = manager.getRepository(PassLoan);
      const loan = await loanRepo.findOne({
        where: { invitationToken },
        relations: ['match', 'seasonPass', 'seasonPass.seat', 'lender'],
      });
      if (!loan) {
        throw new NotFoundException('Invitation not found');
      }
      if (loan.status !== PassLoanStatus.PENDING) {
        throw new BadRequestException(`Invitation is already in state ${loan.status}`);
      }
      if (loan.expiresAt.getTime() < Date.now()) {
        loan.status = PassLoanStatus.EXPIRED;
        await loanRepo.save(loan);
        throw new BadRequestException('Invitation has expired');
      }
      const borrower = await manager.getRepository(User).findOne({ where: { id: borrowerUserId } });
      if (!borrower) {
        throw new NotFoundException('Borrower user not found');
      }
      if (borrower.email.toLowerCase() !== loan.borrowerEmail.toLowerCase()) {
        throw new ForbiddenException('Invitation was issued to a different email address');
      }

      loan.borrowerUserId = borrowerUserId;
      loan.status = PassLoanStatus.ACCEPTED;
      loan.acceptedAt = new Date();
      loan.qrJti = this.qrService.generateJti();
      await loanRepo.save(loan);

      void this.dispatchAcceptanceEmails(loan).catch((error: Error) => {
        this.logger.error(`Loan acceptance emails failed loan=${loan.id}: ${error.message}`);
      });

      return loan;
    });
  }

  async cancelLoan(passId: string, loanId: string, userId: string, dto: CancelLoanDto): Promise<PassLoan> {
    return this.dataSource.transaction(async (manager) => {
      const loanRepo = manager.getRepository(PassLoan);
      const loan = await loanRepo.findOne({
        where: { id: loanId, seasonPassId: passId },
        relations: ['match', 'borrower', 'lender'],
      });
      if (!loan) {
        throw new NotFoundException('Loan not found');
      }
      if (loan.lenderUserId !== userId) {
        throw new ForbiddenException('Only the lender can cancel a loan');
      }
      if (
        loan.status !== PassLoanStatus.PENDING &&
        loan.status !== PassLoanStatus.ACCEPTED
      ) {
        throw new BadRequestException(`Loan in state ${loan.status} cannot be cancelled`);
      }
      const now = new Date();
      const wasAccepted = loan.status === PassLoanStatus.ACCEPTED;
      loan.status = PassLoanStatus.CANCELLED;
      loan.cancelledAt = now;
      loan.cancellationReason = dto.reason;
      if (loan.qrJti) {
        await this.qrService.revoke(loan.qrJti);
        loan.qrRevokedAt = now;
      }
      await loanRepo.save(loan);

      // Notify both parties when an accepted loan is cancelled. Pending loans
      // notify only the borrower (lender just cancelled, no need to mail self).
      void this.dispatchCancellationEmails(loan, wasAccepted).catch((error: Error) => {
        this.logger.error(`Loan cancellation emails failed loan=${loan.id}: ${error.message}`);
      });

      return loan;
    });
  }

  /**
   * Marks an accepted loan as COMPLETED once the match is over and
   * awards loyalty points to the lender. Idempotent.
   */
  async completeLoan(loan: PassLoan): Promise<void> {
    if (loan.status !== PassLoanStatus.ACCEPTED) {
      return;
    }
    await this.dataSource.transaction(async (manager) => {
      const loanRepo = manager.getRepository(PassLoan);
      loan.status = PassLoanStatus.COMPLETED;
      loan.completedAt = new Date();
      if (loan.qrJti) {
        await this.qrService.revoke(loan.qrJti);
        loan.qrRevokedAt = new Date();
      }
      await loanRepo.save(loan);
    });

    try {
      await this.loyaltyService.award({
        userId: loan.lenderUserId,
        type: LoyaltyTransactionType.EARN,
        source: LoyaltyTransactionSource.PASS_LOAN,
        points: this.loyaltyService.getConfig().passLoanPoints,
        referenceId: `loan:${loan.id}`,
        description: 'Bérlet kölcsönzés jutalom',
      });
    } catch (error) {
      this.logger.error(`Loan completion loyalty award failed loan=${loan.id}: ${(error as Error).message}`);
    }
  }

  private async dispatchInvitationEmail(
    loan: PassLoan,
    lender: User,
    match: Match,
    pass: SeasonPass,
  ): Promise<void> {
    const matchSummary = this.renderer.matchSummary(match);
    const acceptUrl = `${this.mailConfig.baseUrl}/loans/accept?token=${encodeURIComponent(loan.invitationToken)}`;
    await this.emailService.send({
      to: loan.borrowerEmail,
      subject: `${lender.firstName} bérletet ajánlott fel - ${matchSummary.title}`,
      template: 'loan-invitation',
      context: {
        recipientName: loan.borrowerEmail.split('@')[0],
        lenderName: `${lender.firstName} ${lender.lastName}`,
        matchTitle: matchSummary.title,
        matchVenue: matchSummary.venue,
        matchKickoffLabel: matchSummary.kickoffLabel,
        seatLabel: pass.seat ? this.renderer.formatSeat(pass.seat) : '-',
        expiresAtLabel: this.renderer.formatKickoff(loan.expiresAt),
        acceptUrl,
      },
      correlationId: `loan-invitation:${loan.id}`,
    });
  }

  private async dispatchAcceptanceEmails(loan: PassLoan): Promise<void> {
    if (!loan.match || !loan.lender || !loan.borrowerUserId || !loan.seasonPass) {
      return;
    }
    const borrower = await this.userRepository.findOne({ where: { id: loan.borrowerUserId } });
    if (!borrower) {
      return;
    }
    const matchSummary = this.renderer.matchSummary(loan.match);
    const seatLabel = loan.seasonPass.seat ? this.renderer.formatSeat(loan.seasonPass.seat) : '-';
    const qrResult = await this.qrService.generateForLoan(loan.id, loan.qrJti ?? undefined);
    const qrUrl = `${this.mailConfig.baseUrl}/profile/loans/${loan.id}`;

    // Borrower email (with QR)
    await this.emailService.send({
      to: borrower.email,
      subject: `Bérlet kölcsön elfogadva - ${matchSummary.title}`,
      template: 'loan-confirmation',
      context: {
        recipientName: borrower.firstName,
        borrowerName: `${borrower.firstName} ${borrower.lastName}`,
        matchTitle: matchSummary.title,
        matchVenue: matchSummary.venue,
        matchKickoffLabel: matchSummary.kickoffLabel,
        seatLabel,
        qrDataUrl: qrResult.dataUrl,
        qrUrl,
        isLender: false,
      },
      correlationId: `loan-confirmation:borrower:${loan.id}`,
    });

    // Lender notification (no QR)
    await this.emailService.send({
      to: loan.lender.email,
      subject: `${borrower.firstName} elfogadta a bérletkölcsönt - ${matchSummary.title}`,
      template: 'loan-confirmation',
      context: {
        recipientName: loan.lender.firstName,
        borrowerName: `${borrower.firstName} ${borrower.lastName}`,
        matchTitle: matchSummary.title,
        matchVenue: matchSummary.venue,
        matchKickoffLabel: matchSummary.kickoffLabel,
        seatLabel,
        qrDataUrl: '',
        qrUrl,
        isLender: true,
      },
      correlationId: `loan-confirmation:lender:${loan.id}`,
    });
  }

  private async dispatchCancellationEmails(loan: PassLoan, wasAccepted: boolean): Promise<void> {
    const match = loan.match
      ? loan.match
      : await this.matchRepository.findOne({ where: { id: loan.matchId } });
    if (!match) {
      return;
    }
    const matchSummary = this.renderer.matchSummary(match);
    const lender =
      loan.lender ?? (await this.userRepository.findOne({ where: { id: loan.lenderUserId } }));
    const borrower =
      loan.borrower ?? (loan.borrowerUserId
        ? await this.userRepository.findOne({ where: { id: loan.borrowerUserId } })
        : null);

    const recipients: Array<{ email: string; name: string; isLender: boolean }> = [];
    // Borrower always notified (they have a stake in the pass)
    if (borrower) {
      recipients.push({ email: borrower.email, name: borrower.firstName, isLender: false });
    } else {
      recipients.push({ email: loan.borrowerEmail, name: loan.borrowerEmail.split('@')[0], isLender: false });
    }
    if (wasAccepted && lender) {
      recipients.push({ email: lender.email, name: lender.firstName, isLender: true });
    }

    for (const recipient of recipients) {
      await this.emailService.send({
        to: recipient.email,
        subject: `Bérlet kölcsönzés visszavonva - ${matchSummary.title}`,
        template: 'loan-cancelled',
        context: {
          recipientName: recipient.name,
          matchTitle: matchSummary.title,
          matchKickoffLabel: matchSummary.kickoffLabel,
          reason: loan.cancellationReason,
          isLender: recipient.isLender,
        },
        correlationId: `loan-cancelled:${recipient.isLender ? 'lender' : 'borrower'}:${loan.id}`,
      });
    }
  }
}
