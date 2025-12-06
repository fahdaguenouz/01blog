import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

export interface Totals {
  totalUsers: number;
  totalPosts: number;
  totalReports: number;
  totalCategories: number;
  openReports: number;
}
export interface StatsPayload {
  totalUsers: number;
  totalPosts: number;
  totalReports: number;
  totalCategories: number;
  openReports: number;
}

export interface DailyStats {
  date: string;
  users: number;
  posts: number;
  reports: number;
}

export interface ReportCategoryStat {
  category: string;
  count: number;
}

export interface TopContributor {
  id: string;
  username: string;
  postsCount: number;
  flaggedCount: number;
  lastActivity: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private base = environment.apiUrl || '';
  private http = inject(HttpClient);

  getStats(): Observable<StatsPayload> {
    return this.http.get<StatsPayload>(`${this.base}/api/admin/stats`, { withCredentials: true });
  }

  getDailyStats(period: '7d' | '30d' | '6m' = '30d'): Observable<DailyStats[]> {
    return this.http.get<DailyStats[]>(`${this.base}/api/admin/stats/trends`, {
      params: { period },
      withCredentials: true,
    });
  }

  getReportCategoryStats(): Observable<ReportCategoryStat[]> {
    return this.http.get<ReportCategoryStat[]>(`${this.base}/api/admin/stats/report-categories`, {
      withCredentials: true,
    });
  }


  getTopContributors(limit = 10): Observable<TopContributor[]> {
    return this.http.get<TopContributor[]>(
      `${this.base}/api/admin/stats/top-contributors`,
      {
        params: { limit },
        withCredentials: true,
      }
    );
  }
}
