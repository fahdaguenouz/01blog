// src/app/services/post.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';


export interface Category {
  id: string;
  name: string;
  slug: string;
}
export interface Post {
  id: string;
  authorId: string;
  authorUsername: string;
  authorName: string;
  avatarUrl?: string;
  title: string;
  excerpt: string;
  body?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  createdAt: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
   isSaved?: boolean; 
  categories?: Category[]; 
}


export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
 text: string; 
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class PostService {
   private base = environment.apiUrl;
  private apiUrl = `${this.base}/api/posts`;

  constructor(private injector: Injector) {
    console.log('PostService api base =', this.base);
  }

  private getHttp(): HttpClient { return this.injector.get(HttpClient); }

getFeed(categoryId?: string, sort: 'new' | 'likes' | 'saved' = 'new'): Observable<Post[]> {
    const params: any = { sort };
    if (categoryId) params.categoryId = categoryId;
    return this.getHttp().get<Post[]>(`${this.apiUrl}/feed`, { params });
  }

   getById(postId: string): Observable<Post> {
    return this.getHttp().get<Post>(`${this.apiUrl}/${postId}`);
  }

  getUserPosts(userId: string): Observable<Post[]> {
    return this.getHttp().get<Post[]>(`${this.apiUrl}/user/${userId}`);
  }

  createPost(title: string, description: string, media?: File, categoryIds: string[] = []): Observable<Post> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    if (media) formData.append('media', media);
    categoryIds.forEach(id => formData.append('categoryIds', id));
    return this.getHttp().post<Post>(`${this.apiUrl}`, formData);
  }

  updatePost(postId: string, title: string, description: string, media?:File, categoryIds: string[] = []): Observable<Post> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    if (media) formData.append('media', media);
    categoryIds.forEach(id => formData.append('categoryIds', id));
    return this.getHttp().put<Post>(`${this.apiUrl}/${postId}`, formData);
  }

  deletePost(postId: string): Observable<void> {
    return this.getHttp().delete<void>(`${this.apiUrl}/${postId}`);
  }

  likePost(postId: string): Observable<void> {
    return this.getHttp().post<void>(`${this.apiUrl}/${postId}/like`, {});
  }
  getLikedPosts(userId: string): Observable<Post[]> {
  return this.getHttp().get<Post[]>(`${this.apiUrl}/user/${userId}/liked`);
}

getSavedPosts(userId: string): Observable<Post[]> {
  return this.getHttp().get<Post[]>(`${this.apiUrl}/user/${userId}/saved`);
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
  savePost(postId: string): Observable<void> {
  return this.getHttp().post<void>(`${this.apiUrl}/${postId}/save`, {});
}

unsavePost(postId: string): Observable<void> {
  return this.getHttp().delete<void>(`${this.apiUrl}/${postId}/save`);
}



}
