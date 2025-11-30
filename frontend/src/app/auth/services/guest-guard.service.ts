// src/app/auth/services/guest-guard.service.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Injectable({ providedIn: 'root' })
export class GuestGuard implements CanActivate {
  constructor(private router: Router, private auth: AuthService) {}

  canActivate(): boolean {
    if (this.auth.isLoggedIn()) {
      if (this.auth.isAdmin()) {
        this.router.navigate(['/admin/dashboard']);   // ADMIN → dashboard
      } else {
        this.router.navigate(['/feed']);              // USER → feed
      }
      return false;
    }
    return true;
  }
}
