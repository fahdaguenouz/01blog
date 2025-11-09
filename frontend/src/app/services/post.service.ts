// src/app/services/post.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Observable } from 'rxjs';

export interface Post {
  id: string;
  userId: string;
  username: string;
   avatarUrl?: string;
  title: string;
  excerpt: string; 
   body?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class PostService {
  private apiUrl = '/api/posts';

  constructor(private injector: Injector) {}

  private getHttp(): HttpClient { return this.injector.get(HttpClient); }

  getFeed(): Observable<Post[]> {
    return this.getHttp().get<Post[]>(`${this.apiUrl}/feed`);
  }

  getById(postId: string): Observable<Post> {
    return this.getHttp().get<Post>(`${this.apiUrl}/${postId}`);
  }

  getUserPosts(userId: string): Observable<Post[]> {
    return this.getHttp().get<Post[]>(`${this.apiUrl}/user/${userId}`);
  }

  createPost(title: string, description: string, media?: File): Observable<Post> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    if (media) formData.append('media', media);
    // Backend expects POST /api/posts
    return this.getHttp().post<Post>(`${this.apiUrl}`, formData);
  }

  updatePost(postId: string, title: string, description: string, media?: File): Observable<Post> {
    // If supporting media replacement, a PUT with multipart is typical
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    if (media) formData.append('media', media);
    return this.getHttp().put<Post>(`${this.apiUrl}/${postId}`, formData);
  }

  deletePost(postId: string): Observable<void> {
    return this.getHttp().delete<void>(`${this.apiUrl}/${postId}`);
  }

  likePost(postId: string): Observable<void> {
    return this.getHttp().post<void>(`${this.apiUrl}/${postId}/like`, {});
  }

  unlikePost(postId: string): Observable<void> {
    return this.getHttp().delete<void>(`${this.apiUrl}/${postId}/like`);
  }

  addComment(postId: string, content: string): Observable<Comment> {
    return this.getHttp().post<Comment>(`${this.apiUrl}/${postId}/comments`, { content });
  }

  getComments(postId: string): Observable<Comment[]> {
    return this.getHttp().get<Comment[]>(`${this.apiUrl}/${postId}/comments`);
  }

  deleteComment(postId: string, commentId: string): Observable<void> {
    return this.getHttp().delete<void>(`${this.apiUrl}/${postId}/comments/${commentId}`);
  }
}
