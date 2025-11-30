// src/app/auth/services/guest-guard.service.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Injectable({ providedIn: 'root' })
export class GuestGuard implements CanActivate {
  constructor(private router: Router, private auth: AuthService) {}

 canActivate(): boolean {
    if (this.auth.isLoggedIn()) {
      // Logged-in user (admin or normal) trying to access guest-only route -> send to feed
      this.router.navigate(['/feed']);
      return false;
    }
    return true;
  }
}
