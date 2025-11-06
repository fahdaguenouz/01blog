// src/app/shared/navabr/navbar.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { NgIf, NgClass } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { LoginService } from '../../auth/services/login.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    NgIf,
    NgClass,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSidenavModule,
    MatListModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  isAuthPage = false;
  loggedIn = false;
  userName: string | null = null;

  private sub?: Subscription;

  constructor(
    private router: Router,
    private auth: AuthService,
    private loginService: LoginService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Only use AuthService, which must be SSR-safe
    this.refreshAuthState();

    // Update flags on navigation end only (prevents extra SSR reads)
    this.sub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      this.isAuthPage = this.router.url.startsWith('/auth');
      this.refreshAuthState();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private refreshAuthState(): void {
    // These calls must be safe on SSR (AuthService guards access internally)
    this.loggedIn = this.auth.isLoggedIn();
    this.userName = this.auth.getUsername();
  }

  logout(): void {
    this.loginService.logout().subscribe({
      next: () => {
        this.toastr.success('Logged out successfully');
        this.auth.clearAuth();          // clear local state
        this.refreshAuthState();
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        this.toastr.error('Error logging out');
        this.auth.clearAuth();
        this.refreshAuthState();
        this.router.navigate(['/auth/login']);
      }
    });
  }
}
