import {
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SeatLockService } from '../../redis/seat-lock.service';
import { SeatsService } from './seats.service';
import { LockSeatResponseDto, MatchSeatsResponseDto } from './dto';

@ApiTags('Seats')
@Controller('matches/:matchId/seats')
export class MatchSeatsController {
  constructor(
    private readonly seatsService: SeatsService,
    private readonly seatLockService: SeatLockService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Egy meccshez tartozó székek valós idejű állapota',
    description:
      'Visszaadja az összes szék státuszát (available / locked / sold / disabled) és a szektoronkénti foglaltsági összesítőt.',
  })
  @ApiOkResponse({ type: MatchSeatsResponseDto })
  @ApiNotFoundResponse({ description: 'Match not found' })
  findSeats(
    @Param('matchId', new ParseUUIDPipe()) matchId: string,
  ): Promise<MatchSeatsResponseDto> {
    return this.seatsService.findSeatsForMatch(matchId);
  }

  @Post(':seatId/lock')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Szék zárolása vásárláshoz',
    description:
      'Atomi `SET NX EX` művelettel zárolja a széket Redis-ben (alapértelmezett TTL 300 mp). Sikeres zárolás esetén egy ownerToken-t kap a hívó.',
  })
  @ApiOkResponse({ type: LockSeatResponseDto })
  @ApiConflictResponse({ description: 'A szék már zárolva van.' })
  async lockSeat(
    @Param('matchId', new ParseUUIDPipe()) matchId: string,
    @Param('seatId', new ParseUUIDPipe()) seatId: string,
  ): Promise<LockSeatResponseDto> {
    const lock = await this.seatLockService.acquire({ matchId, seatId });
    if (!lock) {
      throw new ConflictException(
        `Seat ${seatId} for match ${matchId} is already locked. Please pick a different seat.`,
      );
    }
    const expiresAt = new Date(Date.now() + lock.ttlSeconds * 1000).toISOString();
    return {
      matchId: lock.matchId,
      seatId: lock.seatId,
      ownerToken: lock.ownerToken,
      ttlSeconds: lock.ttlSeconds,
      expiresAt,
    };
  }

  @Delete(':seatId/lock')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Szék zárolásának feloldása',
    description:
      'Lua-alapú feltételes DEL — csak akkor töröl, ha az ownerToken egyezik. Ha a token nem egyezik, NoContent választ ad (idempotens).',
  })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'Lock not held / token mismatch.' })
  async unlockSeat(
    @Param('matchId', new ParseUUIDPipe()) matchId: string,
    @Param('seatId', new ParseUUIDPipe()) seatId: string,
    @Query('ownerToken') ownerToken: string,
  ): Promise<void> {
    if (!ownerToken) {
      throw new NotFoundException('ownerToken query parameter is required.');
    }
    await this.seatLockService.release(matchId, seatId, ownerToken);
  }
}
