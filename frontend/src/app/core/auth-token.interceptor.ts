import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  console.log('[HTTP]', req.method, req.url, 'token?', !!token);

  if (req.url.includes('/api/auth/')) return next(req);
  if (!token) return next(req);

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
