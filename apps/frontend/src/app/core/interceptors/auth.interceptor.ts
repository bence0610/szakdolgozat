import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

/**
 * Attaches the access token (when present) to outgoing requests and, on 401,
 * attempts a single silent refresh + retry. Auth-related endpoints are
 * exempted from the retry loop to avoid recursion.
 */
const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

function isAuthRequest(url: string): boolean {
  return AUTH_PATHS.some((path) => url.includes(path));
}

function attachToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  if (!token) {
    return req;
  }
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });
}

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const auth = inject(AuthService);
  const accessToken = auth.getAccessToken();
  const authedReq = attachToken(req, accessToken);

  if (isAuthRequest(req.url)) {
    return next(authedReq);
  }

  return next(authedReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && accessToken) {
        return auth.refresh().pipe(
          switchMap((response) => {
            if (!response) {
              return throwError(() => error);
            }
            const retried = attachToken(req, response.accessToken);
            return next(retried);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
