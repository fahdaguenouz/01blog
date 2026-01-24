import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private router: Router, private auth: AuthService) {}

  canActivate(): Observable<boolean | UrlTree> {
    if (!this.auth.hasToken()) {
      return of(this.router.parseUrl('/auth/login'));
    }
    
    return this.auth.validateAdminRole().pipe(
      map(isAdmin => (isAdmin ? true : this.router.parseUrl('/feed')))
    );
  }
}