import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoyaltyTransactionSource, LoyaltyTransactionType, User } from '../../database/entities';
import { LoyaltyService } from '../loyalty/loyalty.service';

export interface ProfileUpdate {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  async count(): Promise<number> {
    return this.userRepository.count();
  }

  async findById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    return user;
  }

  /**
   * Updates a user's profile fields and (when the profile becomes "complete"
   * for the first time) awards LOYALTY_PROFILE_COMPLETION_POINTS exactly once.
   *
   * Completion criteria: phone_number AND date_of_birth are present.
   */
  async updateProfile(userId: string, update: ProfileUpdate): Promise<User> {
    const user = await this.findById(userId);

    if (update.firstName !== undefined) user.firstName = update.firstName;
    if (update.lastName !== undefined) user.lastName = update.lastName;
    if (update.phoneNumber !== undefined) user.phoneNumber = update.phoneNumber;
    if (update.dateOfBirth !== undefined) user.dateOfBirth = update.dateOfBirth;

    const wasAlreadyComplete = user.profileCompletedAt !== null && user.profileCompletedAt !== undefined;
    const isNowComplete = Boolean(user.phoneNumber && user.dateOfBirth);

    if (!wasAlreadyComplete && isNowComplete) {
      user.profileCompletedAt = new Date();
    }
    const saved = await this.userRepository.save(user);

    if (!wasAlreadyComplete && isNowComplete) {
      try {
        await this.loyaltyService.award({
          userId: saved.id,
          type: LoyaltyTransactionType.EARN,
          source: LoyaltyTransactionSource.PROFILE_COMPLETION,
          points: this.loyaltyService.getConfig().profileCompletionPoints,
          referenceId: `profile_completion:${saved.id}`,
          description: 'Profil kitöltése jutalom',
        });
      } catch (error) {
        this.logger.error(`Profile completion award failed user=${saved.id}: ${(error as Error).message}`);
      }
    }
    return saved;
  }

  /**
   * Awards registration bonus points exactly once per user (idempotent via
   * referenceId). Intended to be called from the registration flow.
   */
  async awardRegistrationBonus(userId: string): Promise<void> {
    try {
      await this.loyaltyService.award({
        userId,
        type: LoyaltyTransactionType.EARN,
        source: LoyaltyTransactionSource.REGISTRATION,
        points: this.loyaltyService.getConfig().registrationPoints,
        referenceId: `registration:${userId}`,
        description: 'Regisztráció bónusz',
      });
    } catch (error) {
      this.logger.error(`Registration bonus failed user=${userId}: ${(error as Error).message}`);
    }
  }
}
