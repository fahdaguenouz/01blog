import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private router: Router, private auth: AuthService) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.auth.authResolved$.pipe(
      switchMap(() => this.auth.isLoggedIn$),
      map(loggedIn => {
        if (!loggedIn) {
          // Not logged in → login page
          return this.router.parseUrl('/auth/login');
        }

        // Logged in but not admin → normal user, send to feed
        if (!this.auth.isAdmin()) {
          return this.router.parseUrl('/feed');
        }

        // Logged in and admin → allow access to /admin/**
        return true;
      })
    );
  }
}