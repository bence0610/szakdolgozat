/**
 * QR token type discriminator. Embedded in the JWT payload so
 * a single verifier can route to the correct domain (ticket vs loan).
 */
export type QrTokenType = 'ticket' | 'loan';

export const QR_REDIS_KEYS = {
  denylist: (jti: string): string => `qr:deny:${jti}`,
} as const;
