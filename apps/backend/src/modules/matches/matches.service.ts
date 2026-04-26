import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../../database/entities';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
  ) {}

  async findAll(): Promise<Match[]> {
    return this.matchRepository.find({ order: { kickoffAt: 'ASC' } });
  }

  async findOne(id: string): Promise<Match | null> {
    return this.matchRepository.findOne({ where: { id } });
  }
}
