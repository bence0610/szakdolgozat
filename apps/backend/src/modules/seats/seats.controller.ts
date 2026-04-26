import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Seat } from '../../database/entities';
import { SeatsService } from './seats.service';

@ApiTags('Seats')
@Controller('seats')
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  @Get()
  @ApiOkResponse({ description: 'List all active seats' })
  findAll(): Promise<Seat[]> {
    return this.seatsService.findAll();
  }
}
