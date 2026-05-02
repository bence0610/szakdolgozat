import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MatchWeatherForecastDto {
  @ApiProperty({ format: 'uuid' })
  matchId!: string;

  @ApiProperty({ example: 'Kecskemet,HU' })
  city!: string;

  @ApiProperty({ format: 'date-time' })
  forecastFor!: string;

  @ApiProperty({ example: 'Esőzés várható' })
  summary!: string;

  @ApiProperty({ example: 12.4, description: 'Hőmérséklet °C-ban' })
  temperatureCelsius!: number;

  @ApiProperty({ example: 1.2, description: 'Várható csapadék mm/h' })
  precipitationMmPerHour!: number;

  @ApiProperty({ example: 0.65, description: 'Csapadék-valószínűség (0–1)' })
  precipitationProbability!: number;

  @ApiProperty({ example: 4.2, description: 'Szélsebesség m/s' })
  windSpeedMs!: number;

  @ApiProperty({
    example: true,
    description:
      'Igaz, ha a heves csapadék miatt a fedetlen szektorban ülő szurkolóknak figyelmeztetést kell mutatni.',
  })
  rainWarning!: boolean;

  @ApiPropertyOptional({ example: '10d', description: 'OpenWeatherMap ikonkód' })
  icon?: string;

  @ApiProperty({
    example: false,
    description: 'Igaz, ha a backend nem tudta lekérdezni az API-t (pl. hiányzó kulcs).',
  })
  fallback!: boolean;
}
