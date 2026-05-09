import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { StripeConfig } from '../../config';

export const STRIPE_CLIENT = 'STRIPE_CLIENT';

export const stripeProvider: Provider = {
  provide: STRIPE_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): Stripe => {
    const stripeConfig = configService.getOrThrow<StripeConfig>('stripe');
    return new Stripe(stripeConfig.secretKey, {
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
