/**
 * Sanity unit test that does not require a live database/Redis.
 * Verifies that placeholder services compile and respond as expected.
 */
import { Test } from '@nestjs/testing';
import { AuthService } from './modules/auth/auth.service';
import { AdminService } from './modules/admin/admin.service';

describe('Module placeholders', () => {
  it('AuthService exposes ping with status=ready', async () => {
    const ref = await Test.createTestingModule({ providers: [AuthService] }).compile();
    expect(ref.get(AuthService).ping()).toEqual({ module: 'auth', status: 'ready' });
  });

  it('AdminService exposes ping with status=ready', async () => {
    const ref = await Test.createTestingModule({ providers: [AdminService] }).compile();
    expect(ref.get(AdminService).ping()).toEqual({ module: 'admin', status: 'ready' });
  });
});
