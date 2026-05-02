import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Ticket, TicketStatus, User } from '../../database/entities';
import {
  ProfileDto,
  ProfileTicketDto,
  ProfileTicketsDto,
  UpdateProfileDto,
} from './dto';

const ACTIVE_STATUSES: TicketStatus[] = [TicketStatus.PAID, TicketStatus.PENDING_PAYMENT];

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Ticket) private readonly ticketRepository: Repository<Ticket>,
  ) {}

  async count(): Promise<number> {
    return this.userRepository.count();
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async getProfile(userId: string): Promise<ProfileDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Felhasználó nem található.');
    }
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      role: user.role,
      loyaltyTier: user.loyaltyTier,
      loyaltyPoints: user.loyaltyPoints,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      lastLoginAt: user.lastLoginAt?.toISOString(),
      createdAt: user.createdAt.toISOString(),
    };
  }

  async getTickets(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<ProfileTicketsDto> {
    const [rows, total] = await this.ticketRepository.findAndCount({
      where: { userId },
      relations: { match: true, seat: true },
      order: { createdAt: 'DESC' },
      take: Math.min(Math.max(limit, 1), 100),
      skip: Math.max(offset, 0),
    });

    const now = Date.now();
    const items: ProfileTicketDto[] = rows.map((ticket) => {
      const kickoff = ticket.match?.kickoffAt?.getTime() ?? 0;
      const isActive =
        ACTIVE_STATUSES.includes(ticket.status) && kickoff >= now;
      return {
        id: ticket.id,
        matchId: ticket.matchId,
        homeTeam: ticket.match?.homeTeam ?? '',
        awayTeam: ticket.match?.awayTeam ?? '',
        kickoffAt: ticket.match?.kickoffAt.toISOString() ?? '',
        venue: ticket.match?.venue ?? '',
        section: ticket.seat?.section ?? '',
        row: ticket.seat?.row ?? '',
        seatNumber: ticket.seat?.number ?? 0,
        category: ticket.seat?.category ?? 'standard',
        status: ticket.status,
        pricePaid: Math.round(Number(ticket.pricePaid)),
        currency: ticket.currency,
        qrCode: ticket.qrCode,
        purchasedAt: ticket.createdAt.toISOString(),
        isActive,
      };
    });

    return { items, total, limit, offset };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<ProfileDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Felhasználó nem található.');
    }
    if (dto.firstName !== undefined) {
      user.firstName = dto.firstName.trim();
    }
    if (dto.lastName !== undefined) {
      user.lastName = dto.lastName.trim();
    }
    if (dto.phoneNumber !== undefined) {
      user.phoneNumber = dto.phoneNumber.trim() || undefined;
    }
    await this.userRepository.save(user);
    return this.getProfile(userId);
  }

  /**
   * Loads many users by id in one query — used by admin / batch flows.
   */
  async findMany(ids: string[]): Promise<User[]> {
    if (ids.length === 0) {
      return [];
    }
    return this.userRepository.find({ where: { id: In(ids) } });
  }
}
