import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as QRCode from 'qrcode';
import Redis from 'ioredis';
import { nanoid } from 'nanoid';
import { QrConfig } from '../../config';
import { REDIS_CLIENT } from '../../redis/redis.constants';
import { QR_REDIS_KEYS, QrTokenType } from './qr.constants';

export interface QrPayload {
  jti: string;
  sub: string;
  type: QrTokenType;
  iat: number;
  exp?: number;
  iss: string;
}

export interface GenerateQrResult {
  jti: string;
  token: string;
  dataUrl: string;
}

export interface VerifyResult {
  valid: boolean;
  payload?: QrPayload;
  reason?: 'invalid_signature' | 'expired' | 'revoked' | 'wrong_type';
}

/**
 * Centralised JWT-backed QR generation and verification.
 *
 * Tokens are signed with QR_SIGNING_SECRET (separate from auth JWT secret).
 * Each token carries a `jti` that the persistence layer (tickets/loans)
 * stores on the row. Revocation is enforced through both a denylist in
 * Redis (fast path) and a jti-mismatch check at the persistence layer.
 */
@Injectable()
export class QrService {
  private readonly qrConfig: QrConfig;
  private readonly jwtService: JwtService;

  constructor(
    private readonly configService: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    this.qrConfig = this.configService.getOrThrow<QrConfig>('qr');
    this.jwtService = new JwtService({
      secret: this.qrConfig.signingSecret,
    });
  }

  generateJti(): string {
    return nanoid(21);
  }

  async generateForTicket(ticketId: string, jti?: string): Promise<GenerateQrResult> {
    const tokenJti = jti ?? this.generateJti();
    return this.generate({
      sub: ticketId,
      type: 'ticket',
      jti: tokenJti,
      issuer: this.qrConfig.ticketIssuer,
    });
  }

  async generateForLoan(loanId: string, jti?: string): Promise<GenerateQrResult> {
    const tokenJti = jti ?? this.generateJti();
    return this.generate({
      sub: loanId,
      type: 'loan',
      jti: tokenJti,
      issuer: this.qrConfig.loanIssuer,
    });
  }

  async verify(token: string, expectedType: QrTokenType): Promise<VerifyResult> {
    let payload: QrPayload;
    try {
      payload = await this.jwtService.verifyAsync<QrPayload>(token, {
        secret: this.qrConfig.signingSecret,
      });
    } catch {
      return { valid: false, reason: 'invalid_signature' };
    }
    if (payload.type !== expectedType) {
      return { valid: false, reason: 'wrong_type' };
    }
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return { valid: false, reason: 'expired', payload };
    }
    const denied = await this.redis.exists(QR_REDIS_KEYS.denylist(payload.jti));
    if (denied) {
      return { valid: false, reason: 'revoked', payload };
    }
    return { valid: true, payload };
  }

  /**
   * Adds the JTI to the Redis denylist. Pass a TTL in seconds that matches
   * (or exceeds) the expected token lifetime so the denylist key auto-expires.
   * If no TTL is supplied, defaults to 30 days, which covers all match-day
   * use cases.
   */
  async revoke(jti: string, ttlSeconds = 60 * 60 * 24 * 30): Promise<void> {
    await this.redis.set(QR_REDIS_KEYS.denylist(jti), '1', 'EX', ttlSeconds);
  }

  private async generate(options: {
    sub: string;
    type: QrTokenType;
    jti: string;
    issuer: string;
  }): Promise<GenerateQrResult> {
    const token = await this.jwtService.signAsync(
      {
        sub: options.sub,
        type: options.type,
        iss: options.issuer,
      },
      {
        jwtid: options.jti,
      },
    );
    const dataUrl = await QRCode.toDataURL(token, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 360,
      color: { dark: '#0F0F0F', light: '#FFFFFF' },
    });
    return { jti: options.jti, token, dataUrl };
  }
}
