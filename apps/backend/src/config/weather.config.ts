import { registerAs } from '@nestjs/config';

export interface WeatherConfig {
  apiKey: string;
  city: string;
  cacheTtlSeconds: number;
}

export default registerAs(
  'weather',
  (): WeatherConfig => ({
    apiKey: process.env.OPENWEATHER_API_KEY ?? '',
    city: process.env.OPENWEATHER_CITY ?? 'Kecskemet,HU',
    cacheTtlSeconds: parseInt(process.env.OPENWEATHER_CACHE_TTL_SECONDS ?? '3600', 10),
  }),
);
