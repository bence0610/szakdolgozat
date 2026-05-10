import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { QrService } from './qr.service';
import { REDIS_CLIENT } from '../../redis/redis.constants';

// QR generation involves PNG encoding via the `qrcode` package which can take
// >5 s on slow CI runners; raise the per-test timeout to keep this suite stable.
jest.setTimeout(30_000);

class FakeRedis {
  private store = new Map<string, string>();

  async set(key: string, value: string): Promise<'OK'> {
    this.store.set(key, value);
    return 'OK';
  }

  async exists(key: string): Promise<number> {
    return this.store.has(key) ? 1 : 0;
  }
}

describe('QrService', () => {
  let service: QrService;
  let fakeRedis: FakeRedis;

  beforeAll(async () => {
    fakeRedis = new FakeRedis();
    const moduleRef = await Test.createTestingModule({
      providers: [
        QrService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) => {
              if (key === 'qr') {
                return {
                  signingSecret: 'test-secret-test-secret',
                  ticketIssuer: 'kte-ticket-test',
                  loanIssuer: 'kte-loan-test',
                };
              }
              throw new Error(`Unexpected config: ${key}`);
            },
          },
        },
        { provide: REDIS_CLIENT, useValue: fakeRedis },
      ],
    }).compile();
    service = moduleRef.get(QrService);
  });

  it('generates a verifiable ticket QR token', async () => {
    const result = await service.generateForTicket('ticket-123');
    expect(result.token).toBeTruthy();
    expect(result.dataUrl.startsWith('data:image/png;base64,')).toBe(true);
    const verification = await service.verify(result.token, 'ticket');
    expect(verification.valid).toBe(true);
    expect(verification.payload?.sub).toBe('ticket-123');
  });

  it('rejects token with the wrong type discriminator', async () => {
    const result = await service.generateForTicket('ticket-456');
    const verification = await service.verify(result.token, 'loan');
    expect(verification.valid).toBe(false);
    expect(verification.reason).toBe('wrong_type');
  });

  it('marks revoked tokens as invalid via the denylist', async () => {
    const result = await service.generateForLoan('loan-xyz');
    await service.revoke(result.jti, 60);
    const verification = await service.verify(result.token, 'loan');
    expect(verification.valid).toBe(false);
    expect(verification.reason).toBe('revoked');
  });
});
