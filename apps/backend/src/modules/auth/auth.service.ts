import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  /**
   * Placeholder for the auth domain. Iteration 2 introduces actual
   * registration, login, refresh-token rotation, and optional TOTP 2FA.
   */
  ping(): { module: string; status: 'ready' } {
    return { module: 'auth', status: 'ready' };
  }
}
