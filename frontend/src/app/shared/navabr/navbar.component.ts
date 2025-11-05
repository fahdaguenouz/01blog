import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { LoginService } from '../../auth/services/login.service';
import { NgClass } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';

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
export class NavbarComponent {
  isAuthPage = false;

  constructor(
    private router: Router,
    private auth: AuthService,
    private loginService: LoginService,
    private toastr: ToastrService
  ) {
    this.router.events.subscribe(() => {
      this.isAuthPage = this.router.url.startsWith('/auth');
    });
  }

  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  get username(): string | null {
    return this.auth.getUsername();
  }

  logout(): void {
    this.loginService.logout().subscribe({
      next: () => {
        this.toastr.success('Logged out successfully');
        this.router.navigate(['/auth/login']);
      },
      error: (err:any) => {
        this.toastr.error('Error logging out');
        // Still clear auth locally even if backend fails
        this.auth.clearAuth();
        this.router.navigate(['/auth/login']);
      }
    });
  }
}
