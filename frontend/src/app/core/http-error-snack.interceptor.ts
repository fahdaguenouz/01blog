// src/app/core/http-error-snack.interceptor.ts
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SnackService } from './snack.service';
import { toUserMessage } from './http-error.util';
import { AuthService } from '../services/auth.service';

let lastShown = 0;

export const httpErrorSnackInterceptor: HttpInterceptorFn = (req, next) => {
  const snack = inject(SnackService);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        const now = Date.now();
        const canShow = now - lastShown > 1200;

        // ✅ banned: show message + logout + redirect
        if (err.status === 403 && auth.getToken()) {
          const msg = toUserMessage(err, 'Your account has been banned.');
          if (canShow) {
            lastShown = now;
            snack.error(msg);
          }
          auth.forceLogout('banned');
          return throwError(() => err);
        }

        // ✅ skip snack on login request (LoginComponent handles it already)
        if (!req.url.includes('/api/auth/login') && canShow) {
          lastShown = now;
          snack.error(toUserMessage(err));
        }
      }

      return throwError(() => err);
    })
  );
};
