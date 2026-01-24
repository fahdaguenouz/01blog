import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private auth: AuthService) {}

  canActivate(): Observable<boolean | UrlTree> {
    // If no token, redirect immediately
    if (!this.auth.hasToken()) {
      return of(this.router.parseUrl('/auth/login'));
    }

    // If token exists but me$ is null, wait for refreshMe to complete
    return this.auth.refreshMe().pipe(
      map((me) => (me ? true : this.router.parseUrl('/auth/login')))
    );
  }
}