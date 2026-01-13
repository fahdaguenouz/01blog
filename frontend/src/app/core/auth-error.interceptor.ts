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
        // only if user had a token => session got invalidated (logged elsewhere / expired)
        if (auth.getToken()) {
          snack.error('Your session ended (logged in from another browser). Please login again.');
          auth.forceLogout('conflict');
        }
      }
      return throwError(() => err);
    })
  );
};
