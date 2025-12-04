// src/app/admin/dashboard/admin-dashboard.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { KpiCardComponent } from '../components/kpi-card.component';
import { AdminService, StatsPayload } from '../../services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    KpiCardComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  private admin = inject(AdminService);
  private bp = inject(BreakpointObserver);

  // Use the strongly typed StatsPayload from AdminService
  stats: StatsPayload | null = null;

  cols = 2;
  loading = false;
  error: string | null = null;

  ngOnInit() {
    // responsive layout
    this.bp.observe([Breakpoints.Handset]).subscribe(result => {
      this.cols = result.matches ? 1 : 2;
    });

    this.loadStats();
  }

  loadStats() {
    this.loading = true;
    this.error = null;

    this.admin.getStats().subscribe({
      next: (s: StatsPayload) => {
        console.log("s",s);
        
        this.stats = s;
        this.loading = false;
      },
      error: (err: unknown) => {
        console.error('Failed to load admin stats', err);
        this.error = 'Failed to load stats';
        this.loading = false;
      }
    });
  }
}
