import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Functional guard that redirects unauthenticated users to /login with
 * a `returnUrl` query parameter so they bounce back after successful login.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/**
 * Redirects already-authenticated users away from /login and /register.
 */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/']);
};
