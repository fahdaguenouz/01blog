// src/app/admin/users/admin-users.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { AdminService, AdminUser } from '../../services/admin.service';

@Component({
  standalone: true,
  selector: 'app-admin-users',
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Manage Users</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <table mat-table [dataSource]="users" class="mat-elevation-z1" style="width:100%">

          <ng-container matColumnDef="username">
            <th mat-header-cell *matHeaderCellDef> Username </th>
            <td mat-cell *matCellDef="let u">{{ u.username }}</td>
          </ng-container>

          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef> Email </th>
            <td mat-cell *matCellDef="let u">{{ u.email }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef> Status </th>
            <td mat-cell *matCellDef="let u">
              {{ u.status }}
              <button mat-button color="warn" *ngIf="u.status === 'active'" (click)="ban(u)">
                Ban
              </button>
              <button mat-button color="primary" *ngIf="u.status === 'banned'" (click)="unban(u)">
                Unban
              </button>
            </td>
          </ng-container>

          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef> Role </th>
            <td mat-cell *matCellDef="let u">
              <mat-select [value]="u.role" (selectionChange)="changeRole(u, $event.value)">
                <mat-option value="USER">USER</mat-option>
                <mat-option value="ADMIN">ADMIN</mat-option>
              </mat-select>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef> Actions </th>
            <td mat-cell *matCellDef="let u">
              <button mat-icon-button color="warn" (click)="remove(u)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;"></tr>
        </table>
      </mat-card-content>
    </mat-card>
  `,
})
export class AdminUsersComponent implements OnInit {
  users: AdminUser[] = [];
  cols = ['username', 'email', 'status', 'role', 'actions'];

  constructor(private admin: AdminService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.admin.getAllUsers().subscribe({
      next: (u) => (this.users = u),
      error: (err) => console.error('Failed to load users', err),
    });
  }

  ban(u: AdminUser) {
    this.admin.updateUserStatus(u.id, 'banned').subscribe(() => this.load());
  }

  unban(u: AdminUser) {
    this.admin.updateUserStatus(u.id, 'active').subscribe(() => this.load());
  }

  changeRole(u: AdminUser, role: 'USER' | 'ADMIN') {
    this.admin.updateUserRole(u.id, role).subscribe(() => this.load());
  }

  remove(u: AdminUser) {
    if (!confirm(`Delete user ${u.username}?`)) return;
    this.admin.deleteUser(u.id).subscribe(() => this.load());
  }
}
