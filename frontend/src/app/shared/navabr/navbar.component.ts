import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { LoginService } from '../../auth/services/login.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
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
