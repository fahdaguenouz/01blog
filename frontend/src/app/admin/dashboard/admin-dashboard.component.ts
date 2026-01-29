// src/app/admin/dashboard/admin-dashboard.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { KpiCardComponent } from '../components/kpi-cards/kpi-card.component';
import {
  AdminService,
  StatsPayload,
  DailyStats,
  ReportCategoryStat,
  TopContributor,
} from '../../services/admin.service';
import { SvgLineChartComponent } from '../components/line-chart/line-chart.component';
import { SvgDonutChartComponent } from '../components/donuts-chart/donut-chart.component';
import { TopContributorsComponent } from '../components/top-contributors/top-contributors.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SnackService } from '../../core/snack.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    KpiCardComponent,
    SvgLineChartComponent,
    SvgDonutChartComponent,
    TopContributorsComponent,
    MatProgressSpinnerModule,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit {
  private admin = inject(AdminService);
  private bp = inject(BreakpointObserver);
   private snack = inject(SnackService);
  // time‑series data
  trendDataPosts: number[] = [];
  trendLabels: string[] = [];
  topContributors: TopContributor[] = [];

  // donut: reports by category only
  reportDonutLabels: string[] = [];
  reportDonutData: number[] = [];

  period: '30d' | '7d' | '6m' = '30d';
  stats: StatsPayload | null = null;

  cols = 2;
  loading = false;
  error: string | null = null;

  ngOnInit() {
    this.bp.observe([Breakpoints.Handset]).subscribe((result) => {
      this.cols = result.matches ? 1 : 2;
    });

    this.loadStats();
    this.loadTrends();
    this.loadReportCategoryStats();
    this.loadTopContributors();
    if ((this.admin as any).postsUpdated$) {
      (this.admin as any).postsUpdated$.subscribe(() => {
        this.loadTrends();
        this.loadStats();
        this.loadReportCategoryStats();
        this.loadTopContributors();
      });
    }
  }

  setPeriod(p: '7d' | '30d' | '6m' | string) {
    if (p === '7d' || p === '30d' || p === '6m') {
      this.period = p;
      this.loadTrends();
    } else {
      // console.warn('Invalid period:', p);
      this.snack.error('Invalid period selected');
    }
  }

  loadTrends() {
    this.admin.getDailyStats(this.period).subscribe({
      next: (data: DailyStats[]) => {
        this.trendLabels = data.map((d) => d.date);
        this.trendDataPosts = data.map((d) => d.posts);
      },
      error: (err) => {
        // console.error('Failed to load trends', err)
        this.snack.error('Failed to load trends');
      },
    });
  }

  loadStats() {
    this.loading = true;
    this.error = null;

    this.admin.getStats().subscribe({
      next: (s: StatsPayload) => {
        this.stats = s;
        this.loading = false;
      },
      error: (err: unknown) => {
        // console.error('Failed to load admin stats', err);
        this.snack.error('Failed to load admin stats');
        this.error = 'Failed to load stats';
        this.loading = false;
      },
    });
  }

  loadReportCategoryStats() {
    this.admin.getReportCategoryStats().subscribe({
      next: (rows: ReportCategoryStat[]) => {
        this.reportDonutLabels = rows.map((r) => r.category);
        this.reportDonutData = rows.map((r) => r.count);
      },
      error: (err) => {
        // console.error('Failed to load report category stats', err);
        this.snack.error('Failed to load report category stats');
      },
    });
  }

 loadTopContributors() {
  this.admin.getTopContributors(10).subscribe({
    next: (rows) => {
      // console.log('top contributors rows:', rows);
      this.topContributors = rows;
    },
    error: (err) => {
      // console.error('Failed to load top contributors', err);
      this.snack.error('Failed to load top contributors');
    }
  });
}

}
