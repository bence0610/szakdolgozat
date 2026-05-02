import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WaitlistStatus } from '../../../database/entities';

export class WaitlistMatchSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() homeTeam!: string;
  @ApiProperty() awayTeam!: string;
  @ApiProperty() venue!: string;
  @ApiProperty({ format: 'date-time' }) kickoffAt!: string;
}

export class WaitlistEntryDto {
  @ApiProperty() id!: string;
  @ApiProperty() matchId!: string;
  @ApiProperty({ enum: WaitlistStatus }) status!: WaitlistStatus;
  @ApiProperty() requestedQuantity!: number;

  @ApiPropertyOptional({ description: 'Preferált szektor' })
  preferredSection?: string;

  @ApiProperty({ description: 'FIFO pozíció a sorban (1-től)' })
  position!: number;

  @ApiProperty({ description: 'Előtte álló aktív várakozók száma' })
  peopleAhead!: number;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiPropertyOptional({ format: 'date-time' })
  notifiedAt?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Mikor jár le a foglalási lehetőség (csak NOTIFIED státuszban)',
  })
  claimExpiresAt?: string;

  @ApiPropertyOptional({ type: WaitlistMatchSummaryDto })
  match?: WaitlistMatchSummaryDto;
}
