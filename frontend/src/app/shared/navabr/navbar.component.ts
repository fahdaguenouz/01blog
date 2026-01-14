import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd, RouterOutlet } from '@angular/router';
import { NgIf, NgClass, NgFor, CommonModule } from '@angular/common';
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
import { AppNotification, NotificationService } from '../../services/Notification.service';

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
    CommonModule,
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
  notifications: AppNotification[] = [];
notificationTab: 'unseen' | 'seen' = 'unseen';
  hasUnseen = false;
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
    private cd: ChangeDetectorRef,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.refreshAuthState();
    this.sub = this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.isAuthPage = this.router.url.startsWith('/auth');
      this.refreshAuthState();
    });
   if (this.auth.isLoggedIn()) {
    this.loadNotifications();
  }
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
        { label: 'Users', icon: 'group', route: '/users' }  // <-- NEW: Users page for all users
      ];

        if (this.isAdmin) {
          this.navItems.push({ label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard' });
          this.navItems.push({ label: 'Manage Users', icon: 'group', route: '/admin/users' });
          this.navItems.push({ label: 'Reports', icon: 'flag', route: '/admin/reports' });
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

loadNotifications() {
  this.notificationService.getAll().subscribe((n: AppNotification[]) => {
    this.notifications = n;
    this.hasUnseen = n.some((x) => !x.seen);
  });
}

markAllSeen() {
  const unseenIds = this.notifications.filter(n => !n.seen).map(n => n.id);
  if (unseenIds.length === 0) return;

  // Sequential calls for simplicity
  unseenIds.forEach(id => 
    this.notificationService.markSeen(id).subscribe({
      next: () => {
        const notif = this.notifications.find(n => n.id === id);
        if (notif) notif.seen = true;
      }
    })
  );
  this.hasUnseen = false;
}

toggleSeen(n: AppNotification) {
  if (n.seen) {
    this.notificationService.markUnseen(n.id).subscribe({
      next: () => n.seen = false,
      error: () => this.toastr.error('Failed to mark unread')
    });
  } else {
    this.notificationService.markSeen(n.id).subscribe({
      next: () => {
        n.seen = true;
        this.hasUnseen = this.notifications.some(x => !x.seen);
      },
      error: () => this.toastr.error('Failed to mark read')
    });
  }
}



openNotification(n: AppNotification) {
  // Mark as seen if not already
  if (!n.seen) {
    this.notificationService.markSeen(n.id).subscribe({
      next: () => {
        n.seen = true;
        this.hasUnseen = this.notifications.some(x => !x.seen);
      },
      error: () => this.toastr.error('Failed to mark notification as seen')
    });
  }

  // Navigate based on type
  if (n.type === 'USER_FOLLOWED') {
    this.router.navigate(['/profile', n.actorUsername]);
  } else if (n.postId) {
    this.router.navigate(['/post', n.postId]);
  }
}

get unseenNotifications(): AppNotification[] {
  return this.notifications?.filter(n => !n.seen) || [];
}

get seenNotifications(): AppNotification[] {
  return this.notifications?.filter(n => n.seen) || [];
}
showUnseenTab() {
  this.notificationTab = 'unseen';
}

showSeenTab() {
  this.notificationTab = 'seen';
}

formatNotification(n: AppNotification): string {
  switch (n.type) {
    case 'POST_LIKED':
      return `${n.actorUsername} liked your post`;
    case 'POST_COMMENTED':
      return `${n.actorUsername} commented on your post`;
    case 'POST_SAVED':
      return `${n.actorUsername} saved your post`;
    case 'USER_FOLLOWED':
      return `${n.actorUsername} started following you`;
      case 'FOLLOWING_POSTED':
      return `${n.actorUsername} posted a new story`;
    default:
      return 'New notification';
  }
}



}
