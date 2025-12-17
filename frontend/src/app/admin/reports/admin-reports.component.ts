import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Report, ReportService } from '../../services/report.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-admin-reports',
   imports: [
    CommonModule,
    DatePipe,
    MatTableModule,
    MatButtonModule,
    MatChipsModule
  ],
  templateUrl: './admin-reports.component.html',
  styleUrls: ['./admin-reports.component.scss'],
})
export class AdminReportsComponent implements OnInit {
  reports: Report[] = [];
  loading = true;
cols: string[] = [
    'reporter',
    'reported',
    'category',
    'reason',
    'status',
    'created',
    'actions'
  ];
  constructor(private reportService: ReportService) {}

  ngOnInit() {
    this.loadReports();
  }

  loadReports() {
    this.reportService.getReports().subscribe({
      next: (data) => {
        this.reports = data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  updateStatus(report: Report, status: 'reviewed' | 'resolved') {
    this.reportService.updateReportStatus(report.id, status).subscribe(updated => {
      report.status = updated.status;
    });
  }
}
