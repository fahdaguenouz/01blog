// src/app/core/auth-error.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        // ✅ if user had a token and server says 401 => session invalidated (logged in elsewhere)
        if (auth.getToken()) {
          auth.forceLogout('conflict');
        }
      }
      return throwError(() => err);
    })
  );
};
