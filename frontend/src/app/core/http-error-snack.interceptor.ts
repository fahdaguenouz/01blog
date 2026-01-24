import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SnackService } from './snack.service';
import { toUserMessage } from './http-error.util';

let lastShown = 0;

export const httpErrorSnackInterceptor: HttpInterceptorFn = (req, next) => {
  const snack = inject(SnackService);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        const now = Date.now();
        const canShow = now - lastShown > 1200;

        // ✅ skip auth errors here (authErrorInterceptor owns them)
        if (err.status === 401 || err.status === 403) {
          return throwError(() => err);
        }

        // ✅ skip snack on login request (LoginComponent handles it)
        if (!req.url.includes('/api/auth/login') && canShow) {
          lastShown = now;
          snack.error(toUserMessage(err));
        }
      }

      return throwError(() => err);
    })
  );
};
