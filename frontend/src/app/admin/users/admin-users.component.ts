// src/app/admin/users/admin-users.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService, AdminUser } from '../../services/admin.service';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent } from './ConfirmDialogComponent';
import { Router } from '@angular/router';

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
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss'],
})
export class AdminUsersComponent implements OnInit {
  users: AdminUser[] = [];
  cols = ['username', 'email', 'status', 'role', 'actions'];

  private admin = inject(AdminService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private router = inject(Router);


  // optionally set currentAdminId from a trusted source (AuthService / JWT / separate endpoint)
  currentAdminId: string | null = null;

  ngOnInit(): void {
    // Option 1: If you have an endpoint /api/me, call it to get current admin id
    // Option 2: rely on server to exclude current user; set currentAdminId only if you can get it
    this.load();
  }

  load() {
    this.admin.getAllUsers().subscribe({
      next: (u) => {
        this.users = u;
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.snack.open('Failed to load users', 'Close', { duration: 3000 });
      },
    });
  }

  isSelf(u: AdminUser) {
    if (!this.currentAdminId) return false;
    return this.currentAdminId === u.id;
  }

  ban(u: AdminUser) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Ban user', message: `Ban user ${u.username}?` },
    });
    ref.afterClosed().subscribe((yes) => {
      if (!yes) return;
      this.admin.updateUserStatus(u.id, 'banned').subscribe({
        next: () => {
          this.snack.open(`${u.username} banned`, 'Close', { duration: 2500 });
          this.load();
        },
        error: (err) => {
          console.error(err);
          this.snack.open('Failed to ban user', 'Close', { duration: 3000 });
        },
      });
    });
  }

  unban(u: AdminUser) {
    this.admin.updateUserStatus(u.id, 'active').subscribe({
      next: () => {
        this.snack.open(`${u.username} unbanned`, 'Close', { duration: 2500 });
        this.load();
      },
      error: (err) => {
        console.error(err);
        this.snack.open('Failed to unban user', 'Close', { duration: 3000 });
      },
    });
  }

  changeRole(u: AdminUser, role: 'USER' | 'ADMIN') {
    // optionally confirm role changes
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Change role', message: `Change ${u.username}'s role to ${role}?` },
    });

    ref.afterClosed().subscribe((yes) => {
      if (!yes) {
        // reload to reset select
        this.load();
        return;
      }
      this.admin.updateUserRole(u.id, role).subscribe({
        next: () => {
          this.snack.open(`${u.username} role updated`, 'Close', { duration: 2500 });
          this.load();
        },
        error: (err) => {
          console.error(err);
          this.snack.open('Failed to update role', 'Close', { duration: 3000 });
          this.load();
        },
      });
    });
  }
  goToProfile(u: AdminUser) {
  this.router.navigate(['/profile', u.username]);
}


  confirmRemove(u: AdminUser) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete user', message: `Delete user ${u.username}? This action cannot be undone.` },
    });

    ref.afterClosed().subscribe((yes) => {
      if (!yes) return;
      this.admin.deleteUser(u.id).subscribe({
        next: () => {
          this.snack.open(`${u.username} deleted`, 'Close', { duration: 2500 });
          this.load();
        },
        error: (err) => {
          console.error(err);
          this.snack.open('Failed to delete user', 'Close', { duration: 3000 });
        },
      });
    });
  }
}
