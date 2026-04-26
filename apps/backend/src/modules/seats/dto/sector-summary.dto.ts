import { ApiProperty } from '@nestjs/swagger';

/**
 * Aggregated capacity summary per sector for the stadium map header cards.
 */
export class SectorSummaryDto {
  @ApiProperty({ example: 'A' })
  section!: string;

  @ApiProperty({ example: 100 })
  total!: number;

  @ApiProperty({ example: 73 })
  available!: number;

  @ApiProperty({ example: 12 })
  locked!: number;

  @ApiProperty({ example: 15 })
  sold!: number;

  @ApiProperty({
    example: 0.27,
    description: 'Foglaltsági arány 0..1 között ((locked + sold) / total).',
  })
  occupancyRatio!: number;
}
