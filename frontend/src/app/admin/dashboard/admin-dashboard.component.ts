import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { LoginService } from "../../auth/services/login.service";
import { interval, Subject, take, takeUntil } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { AuthService } from "../../services/auth.service";
import { CommonModule } from "@angular/common";
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-admin-dashboard',
   imports: [  // ADD ALL MATERIAL MODULES
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  users: any[] = [];
  displayedColumns = ['username', 'email', 'role', 'actions'];
  private destroy$ = new Subject<void>();
  
  private http = inject(HttpClient);
  private loginService = inject(LoginService);
  private auth = inject(AuthService);

  ngOnInit() {
    this.loadUsers();
    // Re-validate admin role every 5min
    interval(300000).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.auth.validateAdminRole().pipe(take(1)).subscribe(isAdmin => {
        if (!isAdmin) this.loginService.logout();
      });
    });
  }

  loadUsers() {
    const token = this.auth.getToken();
    this.http.get<any[]>('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (users) => this.users = users,
      error: () => {
        console.error('Failed to load users');
        this.auth.clearAuth();
      }
    });
  }

  deleteUser(id: string) {
    if (!confirm('Delete this user?')) return;
    
    const token = this.auth.getToken();
    this.http.delete(`/api/admin/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: () => this.loadUsers(),
      error: (err) => console.error('Delete failed:', err)
    });
  }



  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}