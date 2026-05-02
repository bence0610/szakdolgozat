import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios, { AxiosInstance } from 'axios';
import Redis from 'ioredis';
import { Repository } from 'typeorm';
import { WeatherConfig } from '../../config';
import { Match } from '../../database/entities';
import { REDIS_CLIENT } from '../../redis/redis.constants';
import { MatchWeatherForecastDto } from './dto';

const RAIN_WARNING_THRESHOLD_MM = 0.5;
const OPENWEATHER_FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';

interface OwmListEntry {
  dt: number;
  main: { temp: number };
  weather: { id: number; main: string; description: string; icon: string }[];
  rain?: { '3h'?: number };
  wind?: { speed: number };
  pop?: number;
}

interface OwmForecastResponse {
  list: OwmListEntry[];
  city?: { name: string };
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly config: WeatherConfig;
  private readonly http: AxiosInstance;

  constructor(
    @InjectRepository(Match) private readonly matchRepository: Repository<Match>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    configService: ConfigService,
  ) {
    this.config = configService.getOrThrow<WeatherConfig>('weather');
    this.http = axios.create({ timeout: 8_000 });
  }

  async getForMatch(matchId: string): Promise<MatchWeatherForecastDto> {
    const match = await this.matchRepository.findOne({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundException('Meccs nem található.');
    }

    const cacheKey = `weather:match:${matchId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached) as MatchWeatherForecastDto;
      } catch {
        // fall through to refetch
      }
    }

    const forecast = await this.fetchForecast(match.kickoffAt);
    const dto: MatchWeatherForecastDto = {
      matchId: match.id,
      city: this.config.city,
      forecastFor: match.kickoffAt.toISOString(),
      summary: forecast.summary,
      temperatureCelsius: forecast.temperature,
      precipitationMmPerHour: forecast.precipitation,
      precipitationProbability: forecast.probability,
      windSpeedMs: forecast.wind,
      rainWarning: forecast.precipitation > RAIN_WARNING_THRESHOLD_MM,
      icon: forecast.icon,
      fallback: forecast.fallback,
    };

    await this.redis
      .set(cacheKey, JSON.stringify(dto), 'EX', this.config.cacheTtlSeconds)
      .catch((err: unknown) =>
        this.logger.warn(
          `Failed to cache weather forecast for match ${matchId}: ${err instanceof Error ? err.message : err}`,
        ),
      );

    return dto;
  }

  private async fetchForecast(targetDate: Date): Promise<{
    summary: string;
    temperature: number;
    precipitation: number;
    probability: number;
    wind: number;
    icon?: string;
    fallback: boolean;
  }> {
    if (!this.config.apiKey) {
      this.logger.warn('OPENWEATHER_API_KEY not configured — returning neutral forecast.');
      return {
        summary: 'Időjárási adat nem elérhető',
        temperature: 0,
        precipitation: 0,
        probability: 0,
        wind: 0,
        fallback: true,
      };
    }

    try {
      const { data } = await this.http.get<OwmForecastResponse>(OPENWEATHER_FORECAST_URL, {
        params: {
          q: this.config.city,
          appid: this.config.apiKey,
          units: 'metric',
          lang: 'hu',
        },
      });

      const target = targetDate.getTime();
      const closest =
        data.list.reduce<OwmListEntry | null>((best, entry) => {
          if (!best) {
            return entry;
          }
          return Math.abs(entry.dt * 1000 - target) < Math.abs(best.dt * 1000 - target)
            ? entry
            : best;
        }, null) ?? data.list[0];

      if (!closest) {
        throw new Error('OpenWeatherMap returned an empty list.');
      }

      const description = closest.weather[0]?.description ?? 'változó időjárás';
      // OWM provides 3-hourly accumulation; convert to mm/h.
      const rain3h = closest.rain?.['3h'] ?? 0;
      const precipitation = rain3h / 3;

      return {
        summary: capitalize(description),
        temperature: Number(closest.main.temp.toFixed(1)),
        precipitation: Number(precipitation.toFixed(2)),
        probability: closest.pop ?? 0,
        wind: closest.wind?.speed ?? 0,
        icon: closest.weather[0]?.icon,
        fallback: false,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`OpenWeatherMap call failed: ${message}`);
      return {
        summary: 'Időjárási adat nem elérhető',
        temperature: 0,
        precipitation: 0,
        probability: 0,
        wind: 0,
        fallback: true,
      };
    }
  }
}

function capitalize(value: string): string {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}
