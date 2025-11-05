import { HttpClient } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Observable } from 'rxjs';

export interface Report {
  id: string;
  reportedUserId: string;
  reportedUsername: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = '/api/reports';

  constructor(private injector: Injector) {}

  private getHttp(): HttpClient {
    return this.injector.get(HttpClient);
  }

  reportUser(userId: string, reason: string): Observable<Report> {
    return this.getHttp().post<Report>(this.apiUrl, { userId, reason });
  }

  getReports(): Observable<Report[]> {
    return this.getHttp().get<Report[]>(this.apiUrl);
  }

  updateReportStatus(reportId: string, status: string): Observable<Report> {
    return this.getHttp().patch<Report>(`${this.apiUrl}/${reportId}`, { status });
  }
}
