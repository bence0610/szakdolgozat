import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { ProfileDto, ProfileTicketsDto, UpdateProfileDto } from './dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Get('count')
  @ApiOperation({ summary: 'Regisztrált felhasználók száma (publikus statisztika)' })
  @ApiOkResponse({ description: 'Total number of registered users' })
  async count(): Promise<{ total: number }> {
    const total = await this.usersService.count();
    return { total };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bejelentkezett felhasználó profilja' })
  @ApiOkResponse({ type: ProfileDto })
  @ApiUnauthorizedResponse({ description: 'Bejelentkezés szükséges.' })
  async me(@CurrentUser() user: AuthenticatedUser): Promise<ProfileDto> {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profil adatok frissítése' })
  @ApiOkResponse({ type: ProfileDto })
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<ProfileDto> {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Get('me/tickets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'A felhasználó jegyei (aktív + korábbi)',
    description: 'Lapozható lista. Minden jegyhez visszaadjuk a meccs és szék részleteit.',
  })
  @ApiOkResponse({ type: ProfileTicketsDto })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
  async myTickets(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<ProfileTicketsDto> {
    return this.usersService.getTickets(user.id, limit, offset);
  }
}
