import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';

@ApiTags('Tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('count')
  @ApiOkResponse({ description: 'Total ticket count' })
  async count(): Promise<{ total: number }> {
    const total = await this.ticketsService.count();
    return { total };
  }
}
