import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

export interface Totals { totalUsers: number; totalPosts: number; totalReports: number; totalCategories: number; openReports: number; }
export interface StatsPayload {
  totalUsers: number;
  totalPosts: number;
  totalReports: number;
  totalCategories: number;
  openReports: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private base = environment.apiUrl || '';
  private http = inject(HttpClient);

  getStats(): Observable<StatsPayload> {
    return this.http.get<StatsPayload>(`${this.base}/api/admin/stats`, { withCredentials: true });
  }
}

