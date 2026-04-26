import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum LoyaltyTransactionType {
  EARN = 'earn',
  REDEEM = 'redeem',
  ADJUSTMENT = 'adjustment',
  EXPIRY = 'expiry',
}

export enum LoyaltyTransactionSource {
  TICKET_PURCHASE = 'ticket_purchase',
  SEASON_PASS_PURCHASE = 'season_pass_purchase',
  PROMOTION = 'promotion',
  REWARD_REDEEM = 'reward_redeem',
  ADMIN = 'admin',
}

@Entity({ name: 'loyalty_transactions' })
@Index('idx_loyalty_user', ['userId'])
@Index('idx_loyalty_created', ['createdAt'])
export class LoyaltyTransaction extends BaseEntity {
  @Column({ type: 'varchar', length: 36, name: 'user_id' })
  userId!: string;

  @Column({ type: 'enum', enum: LoyaltyTransactionType })
  type!: LoyaltyTransactionType;

  @Column({ type: 'enum', enum: LoyaltyTransactionSource })
  source!: LoyaltyTransactionSource;

  @Column({ type: 'int' })
  points!: number;

  @Column({ type: 'int', unsigned: true, name: 'balance_after' })
  balanceAfter!: number;

  @Column({ type: 'varchar', length: 36, nullable: true, name: 'reference_id' })
  referenceId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  @ManyToOne(() => User, (user) => user.loyaltyTransactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
