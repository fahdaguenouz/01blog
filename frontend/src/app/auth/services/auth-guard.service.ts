// auth-guard.service.ts snippet

import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private auth: AuthService) {}

  canActivate(): Observable<boolean | UrlTree> {
  return this.auth.authResolved$.pipe(
    switchMap(() => this.auth.isLoggedIn$),
    map(loggedIn => (loggedIn ? true : this.router.parseUrl('/auth/login')))
  );
}

}
