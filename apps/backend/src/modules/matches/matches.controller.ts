import { Controller, Get, NotFoundException, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Match } from '../../database/entities';
import { MatchesService } from './matches.service';

@ApiTags('Matches')
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  @ApiOkResponse({ description: 'List all matches ordered by kickoff' })
  findAll(): Promise<Match[]> {
    return this.matchesService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Get a single match by id' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<Match> {
    const match = await this.matchesService.findOne(id);
    if (!match) {
      throw new NotFoundException(`Match ${id} not found`);
    }
    return match;
  }
}
