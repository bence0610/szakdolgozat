import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import AppDataSource from '../data-source';
import { runInitialSeed } from './initial.seed';

const logger = new Logger('SeedRunner');

async function bootstrap(): Promise<void> {
  try {
    logger.log('Initializing data source...');
    await AppDataSource.initialize();

    await runInitialSeed(AppDataSource);

    logger.log('Seeding finished successfully.');
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed', error instanceof Error ? error.stack : String(error));
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

void bootstrap();
