// src/app/auth/services/auth-guard.service.ts
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private auth: AuthService) {}

  canActivate(_next: ActivatedRouteSnapshot, _state: RouterStateSnapshot): boolean | UrlTree {
    return this.auth.isLoggedIn() ? true : this.router.parseUrl('/auth/login');
  }
}
