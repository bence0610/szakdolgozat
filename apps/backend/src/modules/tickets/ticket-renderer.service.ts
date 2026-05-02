import { Injectable } from '@nestjs/common';
import { Match, Seat, Ticket } from '../../database/entities';

const SEAT_CATEGORY_LABELS: Record<string, string> = {
  standard: 'Normál',
  premium: 'Prémium',
  vip: 'VIP',
  standing: 'Állóhely',
};

export interface RenderedTicketSection {
  seatLabel: string;
  categoryLabel: string;
  pricePaidLabel: string;
}

export interface MatchSummary {
  title: string;
  venue: string;
  kickoffLabel: string;
}

@Injectable()
export class TicketRendererService {
  formatMatchTitle(match: Match): string {
    return `${match.homeTeam} - ${match.awayTeam}`;
  }

  formatKickoff(date: Date): string {
    // Stable Hungarian date string. Avoids locale runtime drift on different
    // OS images by formatting manually.
    const days = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'];
    const months = [
      'január',
      'február',
      'március',
      'április',
      'május',
      'június',
      'július',
      'augusztus',
      'szeptember',
      'október',
      'november',
      'december',
    ];
    const d = new Date(date);
    const year = d.getFullYear();
    const month = months[d.getMonth()];
    const day = d.getDate();
    const dayName = days[d.getDay()];
    const hour = d.getHours().toString().padStart(2, '0');
    const minute = d.getMinutes().toString().padStart(2, '0');
    return `${year}. ${month} ${day}. (${dayName}) ${hour}:${minute}`;
  }

  formatSeat(seat: Seat): string {
    return `${seat.section} szektor / ${seat.row}. sor / ${seat.number}. szék`;
  }

  formatPrice(amount: string | number, currency: string): string {
    const num = typeof amount === 'string' ? Number.parseFloat(amount) : amount;
    return `${num.toLocaleString('hu-HU')} ${currency}`;
  }

  renderTicketSection(ticket: Ticket): RenderedTicketSection {
    if (!ticket.seat) {
      throw new Error(`Ticket ${ticket.id} has no seat relation loaded`);
    }
    return {
      seatLabel: this.formatSeat(ticket.seat),
      categoryLabel: SEAT_CATEGORY_LABELS[ticket.seat.category] ?? ticket.seat.category,
      pricePaidLabel: this.formatPrice(ticket.pricePaid, ticket.currency),
    };
  }

  matchSummary(match: Match): MatchSummary {
    return {
      title: this.formatMatchTitle(match),
      venue: match.venue,
      kickoffLabel: this.formatKickoff(match.kickoffAt),
    };
  }

  computeTotal(tickets: Ticket[]): string {
    const total = tickets.reduce((acc, t) => acc + Number.parseFloat(t.pricePaid), 0);
    return this.formatPrice(total, tickets[0]?.currency ?? 'HUF');
  }
}
