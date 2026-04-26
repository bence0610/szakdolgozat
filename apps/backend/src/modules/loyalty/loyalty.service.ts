import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoyaltyTransaction } from '../../database/entities';

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(LoyaltyTransaction)
    private readonly loyaltyRepository: Repository<LoyaltyTransaction>,
  ) {}

  async count(): Promise<number> {
    return this.loyaltyRepository.count();
  }
}
