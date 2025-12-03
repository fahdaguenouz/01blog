import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private router: Router, private auth: AuthService) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.auth.authResolved$.pipe(
      switchMap(() => {
        if (!this.auth.isLoggedIn()) {
          return of(this.router.parseUrl('/auth/login'));
        }

        // Validate admin role via HTTP (ensure we have fresh data)
        return this.auth.validateAdminRole().pipe(
          map(isAdmin => {
            if (!isAdmin) return this.router.parseUrl('/feed');
            return true;
          })
        );
      })
    );
  }
}
