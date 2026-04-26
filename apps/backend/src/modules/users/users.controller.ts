import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('count')
  @ApiOkResponse({ description: 'Total number of registered users' })
  async count(): Promise<{ total: number }> {
    const total = await this.usersService.count();
    return { total };
  }
}
