import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT, RedisKeys } from '../../redis/redis.constants';

/**
 * Redis-backed refresh-token registry. Stores one record per refresh JWT JTI
 * keyed under `refresh:{userId}:{jti}` with the hashed token as value.
 * Allows token rotation (consume on refresh) and bulk logout (DEL pattern).
 */
@Injectable()
export class RefreshTokenStore {
  private readonly logger = new Logger(RefreshTokenStore.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async save(userId: string, jti: string, ttlSeconds: number): Promise<void> {
    const key = RedisKeys.refreshToken(userId, jti);
    await this.redis.set(key, '1', 'EX', ttlSeconds);
    this.logger.debug(`Stored refresh token ${key} (ttl=${ttlSeconds}s)`);
  }

  async exists(userId: string, jti: string): Promise<boolean> {
    const key = RedisKeys.refreshToken(userId, jti);
    const value = await this.redis.exists(key);
    return value === 1;
  }

  async revoke(userId: string, jti: string): Promise<void> {
    const key = RedisKeys.refreshToken(userId, jti);
    await this.redis.del(key);
    this.logger.debug(`Revoked refresh token ${key}`);
  }

  async revokeAll(userId: string): Promise<void> {
    const pattern = RedisKeys.refreshToken(userId, '*');
    const stream = this.redis.scanStream({ match: pattern, count: 100 });
    const pipeline = this.redis.pipeline();
    let queued = 0;
    for await (const keys of stream) {
      const arr = keys as string[];
      for (const k of arr) {
        pipeline.del(k);
        queued += 1;
      }
    }
    if (queued > 0) {
      await pipeline.exec();
    }
    this.logger.debug(`Revoked ${queued} refresh tokens for user ${userId}`);
  }
}
