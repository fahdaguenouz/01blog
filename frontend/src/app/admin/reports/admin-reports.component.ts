import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Report, ReportService } from '../../services/report.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../users/ConfirmDialogComponent';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin-reports',
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    RouterModule,
    MatIconModule,
  ],
  templateUrl: './admin-reports.component.html',
  styleUrls: ['./admin-reports.component.scss'],
})
export class AdminReportsComponent implements OnInit {
  reports: Report[] = [];
  cols = ['reporter', 'reported', 'category', 'reason', 'target', 'actions'];
  loading = true;
  private reportsApi = inject(ReportService);
  private admin = inject(AdminService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;

    this.reportsApi.getReports().subscribe({
      next: (r) => {
        this.reports = r;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snack.open('Failed to load reports', 'Close', { duration: 3000 });
      },
    });
  }

  banUser(report: Report) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Ban user',
        message: `Ban reported user?`,
      },
    });

    ref.afterClosed().subscribe((yes) => {
      if (!yes) return;

      this.admin.updateUserStatus(report.reportedUserId, 'banned').subscribe({
        next: () => {
          this.snack.open('User banned', 'Close', { duration: 2500 });
          this.resolve(report);
        },
        error: () => this.snack.open('Failed to ban user', 'Close', { duration: 3000 }),
      });
    });
  }

  deleteUser(report: Report) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete user',
        message: `Delete reported user? This cannot be undone.`,
      },
    });

    ref.afterClosed().subscribe((yes) => {
      if (!yes) return;

      this.admin.deleteUser(report.reportedUserId).subscribe({
        next: () => {
          this.snack.open('User deleted', 'Close', { duration: 2500 });
          this.reports = this.reports.filter((r) => r.id !== report.id);
        },
        error: () => this.snack.open('Failed to delete user', 'Close', { duration: 3000 }),
      });
    });
  }

  resolve(report: Report) {
    this.reportsApi.updateReportStatus(report.id, 'resolved').subscribe({
      next: () => {
        this.load(); // reloads fresh data
      },
      error: (err) => {
        // Ignore "not found" errors - report was likely auto-deleted by FK cascade
        if (err.status === 404 || err.error?.message?.includes('not found')) {
          // console.log('Report auto-resolved by post deletion');
          this.snack.open('Report resolved', 'Close', { duration: 2500 });
          this.load();
          return;
        }
        this.snack.open('Failed to resolve report', 'Close', { duration: 3000 });
      },
    });
  }

  deletePost(report: Report) {
    const postId = report.reportedPostId;
    if (!postId) return;

    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Post',
        message: 'Are you sure you want to delete this post?',
      },
    });

    ref.afterClosed().subscribe((yes) => {
      if (!yes) return;

      this.admin.deletePost(postId).subscribe({
        next: () => {
          this.snack.open('Post deleted', 'Close', { duration: 2500 });
          this.reports = this.reports.filter((r) => r.id !== report.id);
        },
        error: () => this.snack.open('Failed to delete post', 'Close', { duration: 3000 }),
      });
    });
  }

  hidePost(report: Report) {
    const postId = report.reportedPostId;
    if (!postId) return;

    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Hide post',
        message: 'Hide this post from the app?',
      },
    });

    ref.afterClosed().subscribe((yes) => {
      if (!yes) return;

      this.admin.setPostStatus(postId, 'hidden').subscribe({
        next: () => {
          report.reportedPostStatus = 'hidden';
          this.snack.open('Post hidden', 'Close', { duration: 2500 });
          // optionally: mark report resolved/resolved
          this.reportsApi.updateReportStatus(report.id, 'resolved').subscribe({
            next: () => this.load(),
            error: () => this.load(),
          });
        },
        error: () => this.snack.open('Failed to hide post', 'Close', { duration: 3000 }),
      });
    });
  }

  activatePost(report: Report) {
    const postId = report.reportedPostId;
    if (!postId) return;

    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Activate post',
        message: 'Make this post visible again?',
      },
    });

    ref.afterClosed().subscribe((yes) => {
      if (!yes) return;

      this.admin.setPostStatus(postId, 'active').subscribe({
        next: () => {
          report.reportedPostStatus = 'active';

          this.snack.open('Post activated', 'Close', { duration: 2500 });
          this.reportsApi.updateReportStatus(report.id, 'resolved').subscribe({
            next: () => this.load(),
            error: () => this.load(),
          });
        },
        error: () => this.snack.open('Failed to activate post', 'Close', { duration: 3000 }),
      });
    });
  }
}
