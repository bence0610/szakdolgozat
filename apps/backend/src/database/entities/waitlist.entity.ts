import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Match } from './match.entity';

export enum WaitlistStatus {
  ACTIVE = 'active',
  NOTIFIED = 'notified',
  CONVERTED = 'converted',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity({ name: 'waitlist' })
@Unique('uq_waitlist_user_match', ['userId', 'matchId'])
@Index('idx_waitlist_match', ['matchId'])
@Index('idx_waitlist_status', ['status'])
export class Waitlist extends BaseEntity {
  @Column({ type: 'varchar', length: 36, name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', length: 36, name: 'match_id' })
  matchId!: string;

  @Column({ type: 'enum', enum: WaitlistStatus, default: WaitlistStatus.ACTIVE })
  status!: WaitlistStatus;

  @Column({ type: 'int', unsigned: true, default: 1, name: 'requested_quantity' })
  requestedQuantity!: number;

  @Column({ type: 'varchar', length: 32, nullable: true, name: 'preferred_section' })
  preferredSection?: string;

  @Column({ type: 'timestamp', nullable: true, name: 'notified_at' })
  notifiedAt?: Date;

  @ManyToOne(() => User, (user) => user.waitlistEntries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => Match, (match) => match.waitlistEntries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_id' })
  match?: Match;
}
