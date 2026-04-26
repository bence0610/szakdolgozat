import { ApiProperty } from '@nestjs/swagger';

export class LockSeatResponseDto {
  @ApiProperty({ format: 'uuid' })
  matchId!: string;

  @ApiProperty({ format: 'uuid' })
  seatId!: string;

  @ApiProperty({
    description: 'Tulajdonos token — ezzel kell később feloldani vagy hosszabbítani a zárolást.',
  })
  ownerToken!: string;

  @ApiProperty({ description: 'Hátralévő érvényességi idő másodpercben.' })
  ttlSeconds!: number;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'A zárolás lejáratának ISO timestamp-je.',
  })
  expiresAt!: string;
}
