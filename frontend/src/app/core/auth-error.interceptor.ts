import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SnackService } from './snack.service';
import { toUserMessage } from './http-error.util';

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const snack = inject(SnackService);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        const isMeCheck = req.url.endsWith('/api/users/me');
        const hasToken = !!auth.getToken();

        // Handle auth failures in ONE place
        if ((err.status === 401 || err.status === 403) && hasToken && !isMeCheck) {
          const msg = toUserMessage(
            err,
            err.status === 403 ? 'Your account has been banned.' : 'Your session ended. Please login again.'
          );

          snack.error(msg);
          auth.forceLogout(err.status === 403 ? 'banned' : 'expired');
        }
      }

      return throwError(() => err);
    })
  );
};
