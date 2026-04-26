import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Competition, MatchStatus } from '../../../database/entities';

/**
 * Compact match representation for listings on the public landing page
 * and the stadium / match selector. The `availableSeats` value reflects
 * remaining capacity after subtracting paid + pending_payment tickets.
 */
export class MatchListItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Kecskeméti TE' })
  homeTeam!: string;

  @ApiProperty({ example: 'Ferencvárosi TC' })
  awayTeam!: string;

  @ApiProperty({ enum: Competition })
  competition!: Competition;

  @ApiProperty({ example: 'Széktói Stadion, Kecskemét' })
  venue!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  kickoffAt!: string;

  @ApiProperty({ enum: MatchStatus })
  status!: MatchStatus;

  @ApiProperty({ example: 12500, description: 'Az alapár forintban (HUF, egész szám).' })
  basePrice!: number;

  @ApiProperty({ example: 8200 })
  capacity!: number;

  @ApiProperty({
    example: 6541,
    description: 'Még szabad székek száma (capacity - foglalt jegyek).',
  })
  availableSeats!: number;

  @ApiProperty({
    description: 'Igaz, ha a KTE a hazai csapat (HOME_TEAM_NAME alapján).',
    example: true,
  })
  isHome!: boolean;

  @ApiPropertyOptional({ description: 'Banner kép URL.' })
  bannerImageUrl?: string;

  @ApiProperty({ description: 'Eligible for season pass.' })
  isSeasonPassEligible!: boolean;
}
