import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Surface backend errors to the user via Material snackbar and rethrow
 * so callers can still handle them. Network/server errors get a generic
 * message; backend-supplied messages take precedence when available.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let message = 'Ismeretlen hiba történt. Próbáld újra később.';
      if (error.status === 0) {
        message = 'Nem sikerült elérni a szervert. Ellenőrizd az internetkapcsolatot.';
      } else if (typeof error.error === 'object' && error.error !== null) {
        const body = error.error as { message?: string | string[] };
        if (Array.isArray(body.message)) {
          message = body.message.join(', ');
        } else if (typeof body.message === 'string') {
          message = body.message;
        }
      }

      snackBar.open(message, 'Bezárás', { duration: 5000, panelClass: ['kte-snackbar-error'] });
      return throwError(() => error);
    }),
  );
};
