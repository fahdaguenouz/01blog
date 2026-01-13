// src/app/services/post.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { EditMediaBlock } from '../post/edit-post/edit-post-component';

export interface Category {
  id: string;
  name: string;
  slug: string;
}
export interface PostMedia {
  id: string;
  url: string;
  description?: string;
  position: number;
  mediaType: string;
  type?: 'image' | 'video';
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
  status?: 'active' | 'hidden';

  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  createdAt: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
  isSaved?: boolean;
  categories?: Category[];
  media?: PostMedia[];
  coverMedia?: PostMedia;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  avatarUrl?: string;
  username: string;
  text: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class PostService {
  private base = environment.apiUrl;
  private apiUrl = `${this.base}/api/posts`;

  constructor(private injector: Injector) {}

  private getHttp(): HttpClient {
    return this.injector.get(HttpClient);
  }

  getFeed(categoryId?: string, sort: 'new' | 'likes' | 'saved' = 'new'): Observable<Post[]> {
    const params: any = { sort };
    if (categoryId) params.categoryId = categoryId;

    return this.getHttp()
      .get<Post[]>(`${this.apiUrl}/feed`, { params })
      .pipe(map((posts) => posts.map((p) => this.normalizePost(p))));
  }

  getById(postId: string): Observable<Post> {
    return this.getHttp()
      .get<Post>(`${this.apiUrl}/${postId}`)
      .pipe(map((post) => this.normalizePost(post)));
  }

  createPostFormData(formData: FormData): Observable<any> {
    return this.getHttp().post<Post>(`${this.apiUrl}`, formData);
  }

  updatePost(
    postId: string,
    title: string,
    body: string,
    mediaBlocks: EditMediaBlock[],
    categoryIds: string[]
  ): Observable<Post> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('body', body);

    const existingMediaIds: string[] = [];
    const removeFlags: boolean[] = [];

    mediaBlocks.forEach((block) => {
      if (block.id) {
        existingMediaIds.push(block.id);
        removeFlags.push(!!block.removed);
      } else if (block.file) {
        formData.append('mediaFiles', block.file);
      }

      formData.append('mediaDescriptions', block.description || '');
    });

    categoryIds.forEach((id) => formData.append('categoryId', id));
    existingMediaIds.forEach((id) => formData.append('existingMediaIds', id));
    removeFlags.forEach((flag) => formData.append('removeExistingFlags', flag.toString()));

    return this.getHttp()
      .put<Post>(`${this.apiUrl}/${postId}`, formData)
      .pipe(map((post) => this.normalizePost(post)));
  }

  deletePost(postId: string): Observable<void> {
    return this.getHttp().delete<void>(`${this.apiUrl}/${postId}`);
  }

  likePost(postId: string): Observable<void> {
    return this.getHttp().post<void>(`${this.apiUrl}/${postId}/like`, {});
  }
  getUserPosts(userId: string): Observable<Post[]> {
    return this.getHttp()
      .get<Post[]>(`${this.apiUrl}/user/${userId}/posts`)
      .pipe(map((posts) => posts.map((p) => this.normalizePost(p))));
  }

  getLikedPosts(userId: string): Observable<Post[]> {
    return this.getHttp()
      .get<Post[]>(`${this.apiUrl}/user/${userId}/liked`)
      .pipe(map((posts) => posts.map((p) => this.normalizePost(p))));
  }

  getSavedPosts(userId: string): Observable<Post[]> {
    return this.getHttp()
      .get<Post[]>(`${this.apiUrl}/user/${userId}/saved`)
      .pipe(map((posts) => posts.map((p) => this.normalizePost(p))));
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

  private normalizePost(post: Post): Post {
    // RESET (important to avoid leftovers)
    post.coverMedia = undefined;

    if (post.media && post.media.length > 0) {
      post.media = post.media.map((m) => ({
        ...m,
        url: m.url.startsWith('http') ? m.url : `${this.base}${m.url}`,
        type: m.mediaType.startsWith('image')
          ? 'image'
          : m.mediaType.startsWith('video')
          ? 'video'
          : undefined,
      }));

      post.coverMedia =
        post.media.find((m) => m.position === 1) ??
        post.media.sort((a, b) => a.position - b.position)[0];
    }

    return post;
  }
}
