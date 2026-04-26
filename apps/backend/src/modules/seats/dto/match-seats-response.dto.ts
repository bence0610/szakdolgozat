import { ApiProperty } from '@nestjs/swagger';
import { SeatStatusDto } from './seat-status.dto';
import { SectorSummaryDto } from './sector-summary.dto';

export class MatchSeatsResponseDto {
  @ApiProperty({ format: 'uuid' })
  matchId!: string;

  @ApiProperty({ type: [SeatStatusDto] })
  seats!: SeatStatusDto[];

  @ApiProperty({ type: [SectorSummaryDto] })
  sectorSummary!: SectorSummaryDto[];
}
