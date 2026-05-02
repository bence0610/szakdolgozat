import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { MatchWeatherForecastDto } from './dto';
import { WeatherService } from './weather.service';

@ApiTags('Weather')
@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Public()
  @Get('match/:matchId')
  @ApiOperation({
    summary: 'Időjárás-előrejelzés egy meccsre',
    description:
      'Az OpenWeatherMap 5 napos / 3 órás előrejelzéséből a meccs kezdési idejéhez legközelebbi rekordot adja vissza, és ennek alapján határozza meg a `rainWarning` flag-et (csapadék > 0.5 mm/h).',
  })
  @ApiOkResponse({ type: MatchWeatherForecastDto })
  async forMatch(
    @Param('matchId', new ParseUUIDPipe()) matchId: string,
  ): Promise<MatchWeatherForecastDto> {
    return this.weatherService.getForMatch(matchId);
  }
}
