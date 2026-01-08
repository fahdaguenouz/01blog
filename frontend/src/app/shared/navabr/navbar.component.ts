import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd, RouterOutlet } from '@angular/router';
import { NgIf, NgClass, NgFor } from '@angular/common';
import { MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { LoginService } from '../../auth/services/login.service';
import { UserService } from '../../services/user.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    NgIf,
    RouterOutlet,
    NgClass,
    NgFor,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSidenavModule,
    MatListModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  isAuthPage = false;
  loggedIn = false;
  userName: string | null = null;
  isAdmin = false;
  private sub?: Subscription;

  navItems: NavItem[] = [
    { label: 'Home', icon: 'home', route: '/' },
    { label: 'Feed', icon: 'dynamic_feed', route: '/feed' },
  ];
  avatarUrl: string | null = null;
  constructor(
    private router: Router,
    private auth: AuthService,
    private loginService: LoginService,
    private toastr: ToastrService,
    private userService: UserService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.refreshAuthState();
    this.sub = this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.isAuthPage = this.router.url.startsWith('/auth');
      this.refreshAuthState();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private refreshAuthState(): void {
    this.loggedIn = this.auth.isLoggedIn();
    this.userName = this.auth.getUsername();
    if (this.loggedIn) {
      this.auth.validateAdminRole().subscribe((isAdmin) => {
        this.isAdmin = isAdmin;

        this.navItems = [
          { label: 'Feed', icon: 'dynamic_feed', route: '/feed' },
        ];

        if (this.isAdmin) {
          this.navItems.push({ label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard' });
          this.navItems.push({ label: 'Users', icon: 'group', route: '/admin/users' });
          this.navItems.push({ label: 'Reports', icon: 'group', route: '/admin/reports' });
        }

        this.cd.detectChanges();
      });

      if (this.userName) {
        this.userService.getProfileByUsername(this.userName).subscribe({
          next: (user) => (this.avatarUrl = user.avatarUrl || null),
          error: () => (this.avatarUrl = null),
        });
      }
    } else {
      this.isAdmin = false;
      this.avatarUrl = null;
    }
  }
  goToMyProfile(): void {
    if (this.userName) {
      this.router.navigate(['/profile', this.userName]);
    }
  }

  logout(): void {
    this.loginService.logout().subscribe({
      next: () => {
        this.toastr.success('Logged out successfully');
        this.auth.clearAuth();
        this.refreshAuthState();
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        this.toastr.error('Error logging out');
        this.auth.clearAuth();
        this.refreshAuthState();
        this.router.navigate(['/auth/login']);
      },
    });
  }
}
