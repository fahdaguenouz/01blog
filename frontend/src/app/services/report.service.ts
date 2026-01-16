// src/app/services/report.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

export interface Report {
  id: string;

  reporterId: string;
  reporterUsername: string;
  reporterAvatarUrl?: string;

  reportedUserId: string;
  reportedUsername: string;
  reportedAvatarUrl?: string;

  reportedPostId?: string;
  reportedCommentId?: string;

  category: string;
  reason: string;
  status: 'waiting' | 'reviewed' | 'resolved';
  createdAt: string;

  reportedPostStatus?: 'active' | 'hidden' | string;
}

export interface CreatePostReport {
  reportedUserId: string;
  reportedPostId: string;
  category: string;
  reason: string;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private base = environment.apiUrl || '';
  private http = inject(HttpClient);
  private apiUrl = `${this.base}/api/reports`;

  reportPost(payload: CreatePostReport): Observable<Report> {
    return this.http.post<Report>(this.apiUrl, payload);
  }

  // admin-only later:
  getReports(): Observable<Report[]> {
    return this.http.get<Report[]>(this.apiUrl);
  }

  updateReportStatus(reportId: string, status: string): Observable<Report> {
    return this.http.patch<Report>(
      `${this.apiUrl}/${reportId}`,
      { status }
    );
  }
  deletePost(postId: string) {
    return this.http.delete(`${this.apiUrl}/post/${postId}`);
  }

  banUser(userId: string) {
    return this.http.delete(`${this.apiUrl}/user/${userId}`);
  }
}
