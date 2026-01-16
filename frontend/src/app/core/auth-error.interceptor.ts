import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SnackService } from './snack.service';

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const snack = inject(SnackService);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        // don’t spam logout during startup /me check
        if (auth.getToken() && !req.url.endsWith('/api/users/me')) {
          snack.error('Your session ended. Please login again.');
          auth.forceLogout('conflict');
        }
      }
      return throwError(() => err);
    })
  );
};
