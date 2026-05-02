import { registerAs } from '@nestjs/config';

export interface WaitlistConfig {
  /**
   * Time-to-live for the Redis claim slot a notified waitlist entry holds
   * before it expires and the spot is offered to the next person in line.
   */
  claimTtlSeconds: number;
}

export default registerAs(
  'waitlist',
  (): WaitlistConfig => ({
    claimTtlSeconds: parseInt(process.env.WAITLIST_CLAIM_TTL_SECONDS ?? '600', 10),
  }),
);
