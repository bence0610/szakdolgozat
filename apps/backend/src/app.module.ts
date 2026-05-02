import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configurations, envValidationSchema } from './config';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MatchesModule } from './modules/matches/matches.module';
import { SeatsModule } from './modules/seats/seats.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { WaitlistModule } from './modules/waitlist/waitlist.module';
import { AdminModule } from './modules/admin/admin.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';
import { HealthModule } from './modules/health/health.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { WeatherModule } from './modules/weather/weather.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: configurations,
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
      },
      envFilePath: ['.env'],
    }),
    DatabaseModule,
    RedisModule,
    HealthModule,
    AuthModule,
    UsersModule,
    MatchesModule,
    SeatsModule,
    TicketsModule,
    LoyaltyModule,
    WaitlistModule,
    AdminModule,
    ChatbotModule,
    PaymentsModule,
    WeatherModule,
  ],
})
export class AppModule {}
