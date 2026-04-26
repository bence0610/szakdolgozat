import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { LoyaltyService } from './loyalty.service';

@ApiTags('Loyalty')
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('transactions/count')
  @ApiOkResponse({ description: 'Total loyalty transactions count' })
  async count(): Promise<{ total: number }> {
    const total = await this.loyaltyService.count();
    return { total };
  }
}
