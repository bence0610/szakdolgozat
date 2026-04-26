import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { resolve } from 'path';
import { DatabaseConfig } from '../config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const dbConfig = configService.getOrThrow<DatabaseConfig>('database');
        return {
          type: 'mysql',
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.database,
          entities: [resolve(__dirname, 'entities/*.entity.{ts,js}')],
          migrations: [resolve(__dirname, 'migrations/*.{ts,js}')],
          synchronize: dbConfig.synchronize,
          logging: dbConfig.logging,
          charset: 'utf8mb4_unicode_ci',
          timezone: 'Z',
          autoLoadEntities: true,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
