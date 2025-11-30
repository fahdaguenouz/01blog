import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private router: Router, private auth: AuthService) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.auth.isLoggedIn$.pipe(
      map(loggedIn => {
        if (!loggedIn) return this.router.parseUrl('/auth/login');
        if (!this.auth.isAdmin()) return this.router.parseUrl('/feed');
        return true;
      })
    );
  }
}
