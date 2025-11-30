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
  template: `
    <mat-toolbar color="primary">
      <span>Admin Dashboard</span>
      <span class="spacer"></span>
      <button mat-icon-button (click)="logout()" matTooltip="Logout">
        <mat-icon>logout</mat-icon>
      </button>
    </mat-toolbar>
    
    <div class="p-6">
      <mat-tab-group>
        <mat-tab label="Users">
          <div class="mt-4">
            <table mat-table [dataSource]="users" class="w-full">
              <ng-container matColumnDef="username">
                <th mat-header-cell *matHeaderCellDef>Username</th>
                <td mat-cell *matCellDef="let user">{{user.username}}</td>
              </ng-container>
              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef>Email</th>
                <td mat-cell *matCellDef="let user">{{user.email}}</td>
              </ng-container>
              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef>Role</th>
                <td mat-cell *matCellDef="let user">
                  <mat-chip [color]="user.role === 'ADMIN' ? 'warn' : 'primary'">
                    {{user.role}}
                  </mat-chip>
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let user">
                  <button mat-icon-button color="warn" (click)="deleteUser(user.id)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>
              
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `
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

  logout() { 
    this.loginService.logout().subscribe(); 
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}