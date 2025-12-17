import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
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

@Component({
  selector: 'app-admin-reports',
  imports: [
    CommonModule,
    DatePipe,
    MatTableModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    RouterModule,
  ],
  templateUrl: './admin-reports.component.html',
  styleUrls: ['./admin-reports.component.scss'],
})
export class AdminReportsComponent implements OnInit {
  reports: Report[] = [];
  cols = ['reporter', 'reported', 'category', 'reason', 'post', 'actions'];
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
        // Filter out reports with no post (already deleted)
        this.reports = r.filter((report) => report.reportedPostId != null);
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
          this.resolve(report);
        },
        error: () => this.snack.open('Failed to delete user', 'Close', { duration: 3000 }),
      });
    });
  }

  resolve(report: Report) {
    this.reportsApi.updateReportStatus(report.id, 'resolved').subscribe(() => {
      this.load();
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
          this.resolve(report);
        },
        error: () => this.snack.open('Failed to delete post', 'Close', { duration: 3000 }),
      });
    });
  }
}
