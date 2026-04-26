import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MatchListItemDto } from './match-list-item.dto';

export class MatchDetailDto extends MatchListItemDto {
  @ApiPropertyOptional({ description: 'Hosszú leírás a meccsről.' })
  description?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}
