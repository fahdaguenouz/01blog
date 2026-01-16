import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Injectable({ providedIn: 'root' })
export class GuestGuard implements CanActivate {
  constructor(private router: Router, private auth: AuthService) {}

  canActivate(): boolean | UrlTree {
    // If token exists, send user to feed (admin redirect will happen once /me loads)
    return this.auth.hasToken() ? this.router.parseUrl('/feed') : true;
  }
}
