import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { SeasonPass } from './season-pass.entity';
import { User } from './user.entity';
import { Match } from './match.entity';

export enum PassLoanStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
  USED = 'used',
}

@Entity({ name: 'pass_loans' })
@Index('idx_pass_loans_pass', ['seasonPassId'])
@Index('idx_pass_loans_borrower', ['borrowerUserId'])
@Index('idx_pass_loans_match', ['matchId'])
export class PassLoan extends BaseEntity {
  @Column({ type: 'varchar', length: 36, name: 'season_pass_id' })
  seasonPassId!: string;

  @Column({ type: 'varchar', length: 36, name: 'lender_user_id' })
  lenderUserId!: string;

  @Column({ type: 'varchar', length: 36, nullable: true, name: 'borrower_user_id' })
  borrowerUserId?: string;

  @Column({ type: 'varchar', length: 36, name: 'match_id' })
  matchId!: string;

  @Column({ type: 'varchar', length: 255, name: 'borrower_email' })
  borrowerEmail!: string;

  @Column({ type: 'enum', enum: PassLoanStatus, default: PassLoanStatus.PENDING })
  status!: PassLoanStatus;

  @Column({ type: 'varchar', length: 64, unique: true, name: 'invitation_token' })
  invitationToken!: string;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt!: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'accepted_at' })
  acceptedAt?: Date;

  @ManyToOne(() => SeasonPass, (pass) => pass.loans, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'season_pass_id' })
  seasonPass?: SeasonPass;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'lender_user_id' })
  lender?: User;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'borrower_user_id' })
  borrower?: User;

  @ManyToOne(() => Match, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'match_id' })
  match?: Match;
}
