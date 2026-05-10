import { Logger, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { StripeConfig } from '../../config';

export const STRIPE_CLIENT = 'STRIPE_CLIENT';

export const stripeProvider: Provider = {
  provide: STRIPE_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): Stripe => {
    const logger = new Logger('StripeProvider');
    const stripeConfig = configService.getOrThrow<StripeConfig>('stripe');
    const apiKey = stripeConfig.secretKey;
    console.debug(`[Stripe] Loading key: ${apiKey?.substring(0, 10)}...`);

    if (!apiKey || apiKey.startsWith('sk_test_xxx') || apiKey === 'sk_test_xxx') {
      logger.error(
        'STRIPE_SECRET_KEY is missing or set to the placeholder value. ' +
          'Verify that apps/backend/.env exists and is being loaded (check ConfigModule envFilePath / process.cwd()).',
      );
      throw new Error('Invalid STRIPE_SECRET_KEY: placeholder or empty value detected.');
    }

    return new Stripe(apiKey, {
      apiVersion: '2024-06-20' as Stripe.LatestApiVersion,
      typescript: true,
      maxNetworkRetries: 2,
      timeout: 10_000,
      appInfo: {
        name: 'KTE Jegyportal',
        version: '0.1.0',
      },
    });
  },
};
