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

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  status: string; // "active" / "banned"
  role: 'USER' | 'ADMIN';
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private base = environment.apiUrl || '';
  private http = inject(HttpClient);

  getStats(): Observable<StatsPayload> {
    return this.http.get<StatsPayload>(`${this.base}/api/admin/stats`);
  }

  getDailyStats(period: '7d' | '30d' | '6m' = '30d'): Observable<DailyStats[]> {
    return this.http.get<DailyStats[]>(`${this.base}/api/admin/stats/trends`, {
      params: { period }
    });
  }

  getReportCategoryStats(): Observable<ReportCategoryStat[]> {
    return this.http.get<ReportCategoryStat[]>(`${this.base}/api/admin/stats/report-categories`);
  }

  getTopContributors(limit = 10): Observable<TopContributor[]> {
    return this.http.get<TopContributor[]>(`${this.base}/api/admin/stats/top-contributors`, {
      params: { limit }
    });
  }

  getAllUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.base}/api/admin/users`);
  }

  updateUserStatus(id: string, status: 'active' | 'banned'): Observable<AdminUser> {
    return this.http.patch<AdminUser>(
      `${this.base}/api/admin/users/${id}/status`,
      { status }
    );
  }

  updateUserRole(id: string, role: 'USER' | 'ADMIN'): Observable<AdminUser> {
    return this.http.patch<AdminUser>(
      `${this.base}/api/admin/users/${id}/role`,
      { role }
    );
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/admin/users/${id}`);
  }

  getCurrentUser(): Observable<{ id: string; username: string; role: string }> {
    return this.http.get<{ id: string; username: string; role: string }>(
      `${this.base}/api/users/me`
    );
  }

  deletePost(postId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/admin/posts/${postId}`);
  }

  setPostStatus(postId: string, status: 'active' | 'hidden') {
  return this.http.patch<void>(
    `${this.base}/api/admin/posts/${postId}/status`,
    { status }
  );
}
}
