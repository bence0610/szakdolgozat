import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Ticket } from './ticket.entity';

export enum SeatCategory {
  STANDARD = 'standard',
  PREMIUM = 'premium',
  VIP = 'vip',
  STANDING = 'standing',
}

@Entity({ name: 'seats' })
@Index('idx_seats_section_row_number', ['section', 'row', 'number'], { unique: true })
@Index('idx_seats_category', ['category'])
export class Seat extends BaseEntity {
  @Column({ type: 'varchar', length: 32 })
  section!: string;

  @Column({ type: 'varchar', length: 16 })
  row!: string;

  @Column({ type: 'int', unsigned: true })
  number!: number;

  @Column({ type: 'enum', enum: SeatCategory, default: SeatCategory.STANDARD })
  category!: SeatCategory;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'price_modifier', default: '1.00' })
  priceModifier!: string;

  @Column({ type: 'boolean', default: false, name: 'is_accessible' })
  isAccessible!: boolean;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @OneToMany(() => Ticket, (ticket) => ticket.seat)
  tickets?: Ticket[];
}
