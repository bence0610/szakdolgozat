export const REDIS_CLIENT = 'REDIS_CLIENT';

/**
 * Redis key naming conventions for the project.
 * Always use these helpers; never hard-code keys at call sites.
 */
export const RedisKeys = {
  seatLock: (matchId: string, seatId: string): string => `seat-lock:${matchId}:${seatId}`,
  seatLockOwner: (matchId: string, userId: string): string => `seat-lock-owner:${matchId}:${userId}`,
  refreshToken: (userId: string, jti: string): string => `refresh:${userId}:${jti}`,
  rateLimit: (scope: string, identifier: string): string => `rate:${scope}:${identifier}`,
} as const;
