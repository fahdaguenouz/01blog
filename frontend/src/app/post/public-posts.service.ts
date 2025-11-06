// src/app/public-posts/public-posts.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface PublicPostSummary {
  id: string;
  title: string;
  excerpt: string;
  authorName: string | null;
  authorUsername: string | null;
  authorId: string | null;
  likes: number;
  comments: number;
  impressions: number;
  createdAt: string;
}

export interface PublicPostDetail {
  id: string;
  title: string;
  body: string;
  authorName: string | null;
  authorUsername: string | null;
  authorId: string | null;
  likes: number;
  comments: number;
  impressions: number;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({ providedIn: 'root' })
export class PublicPostsService {
  private base = '/api/public/posts';

  constructor(private http: HttpClient) {}

  list(page = 0, size = 6, status = 'active') {
    return this.http.get<PageResponse<PublicPostSummary>>(
      `${this.base}?page=${page}&size=${size}&status=${status}`
    );
  }

  get(id: string) {
    return this.http.get<PublicPostDetail>(`${this.base}/${id}`);
  }
}
