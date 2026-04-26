import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { WaitlistService } from './waitlist.service';

@ApiTags('Waitlist')
@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Get('count')
  @ApiOkResponse({ description: 'Total waitlist entries' })
  async count(): Promise<{ total: number }> {
    const total = await this.waitlistService.count();
    return { total };
  }
}
