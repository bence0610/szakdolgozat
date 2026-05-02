import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class ScanTicketDto {
  /**
   * The JWT-encoded QR token presented by the visitor at the gate.
   * Optional because some scan flows pass only the path-id (already verified
   * by other means, e.g. trusted operator app).
   */
  @ApiProperty({ required: false, example: 'eyJhbGciOi...' })
  @IsOptional()
  @IsString()
  @MinLength(20)
  token?: string;
}

export class TicketScanResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ enum: ['ok', 'already_used', 'invalid', 'expired', 'wrong_match'] })
  result!: 'ok' | 'already_used' | 'invalid' | 'expired' | 'wrong_match';

  @ApiProperty({ required: false })
  ticketId?: string;

  @ApiProperty({ required: false })
  scannedAt?: string;

  @ApiProperty({ required: false })
  message?: string;
}
