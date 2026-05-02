import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Functional guard that allows only ADMIN or SUPER_ADMIN users into the
 * /admin routes. Anonymous users are bounced to /login (with returnUrl);
 * authenticated fans are redirected to / with a friendly fallback.
 */
export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
  const user = auth.getCurrentUser();
  if (!user) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
  if (user.role === 'admin' || user.role === 'super_admin') {
    return true;
  }
  return router.createUrlTree(['/']);
};
