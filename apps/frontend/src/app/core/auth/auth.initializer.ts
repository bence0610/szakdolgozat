import { APP_INITIALIZER, Provider } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Performs a silent /auth/refresh on app boot so a previously logged-in user
 * is immediately recognized after a page reload.
 *
 * Always resolves — even if the refresh fails — so the app never blocks
 * on auth bootstrap.
 */
export function provideAuthInitializer(): Provider {
  return {
    provide: APP_INITIALIZER,
    multi: true,
    useFactory: (auth: AuthService) => () =>
      firstValueFrom(auth.restoreSession()).catch(() => null),
    deps: [AuthService],
  };
}
