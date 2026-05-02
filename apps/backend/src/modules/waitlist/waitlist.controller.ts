import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { JoinWaitlistDto, WaitlistEntryDto } from './dto';
import { WaitlistNotificationService } from './waitlist-notification.service';
import { WaitlistService } from './waitlist.service';

@ApiTags('Waitlist')
@ApiBearerAuth()
@Controller('waitlist')
@UseGuards(JwtAuthGuard)
export class WaitlistController {
  constructor(
    private readonly waitlistService: WaitlistService,
    private readonly notificationService: WaitlistNotificationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Csatlakozás a meccs várólistájához' })
  @ApiCreatedResponse({ type: WaitlistEntryDto })
  async join(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: JoinWaitlistDto,
  ): Promise<WaitlistEntryDto> {
    return this.waitlistService.joinWaitlist(user.id, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'A felhasználó aktív várólista bejegyzései' })
  @ApiOkResponse({ type: [WaitlistEntryDto] })
  async listMine(@CurrentUser() user: AuthenticatedUser): Promise<WaitlistEntryDto[]> {
    return this.waitlistService.getMyEntries(user.id);
  }

  @Delete(':matchId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Lemondás a várólistáról' })
  @ApiNoContentResponse()
  async leave(
    @CurrentUser() user: AuthenticatedUser,
    @Param('matchId', new ParseUUIDPipe()) matchId: string,
  ): Promise<void> {
    await this.waitlistService.leaveWaitlist(user.id, matchId);
  }

  @Post(':matchId/claim')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'A NOTIFIED státuszú lehetőség megerősítése (átalakítás CONVERTED-re).',
    description:
      'A megerősítés után a felhasználó a normál stadiontérképen vásárolhatja meg a jegyét. A claim Redis kulcs törlődik.',
  })
  @ApiOkResponse({ schema: { example: { ok: true } } })
  async claim(
    @CurrentUser() user: AuthenticatedUser,
    @Param('matchId', new ParseUUIDPipe()) matchId: string,
  ): Promise<{ ok: true }> {
    await this.notificationService.claimReservation(user.id, matchId);
    return { ok: true };
  }
}
