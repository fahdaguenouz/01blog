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
  body?: string;
  status?: 'active' | 'hidden';
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

  constructor(private http: HttpClient) {}


  getFeed(categoryId?: string, sort: 'new' | 'likes' | 'saved' = 'new'): Observable<Post[]> {
    const params: any = { sort };
    if (categoryId) params.categoryId = categoryId;

    return this.http
      .get<Post[]>(`${this.apiUrl}/feed`, { params })
      .pipe(map((posts) => posts.map((p) => this.normalizePost(p))));
  }

  getById(postId: string): Observable<Post> {
    return this.http
      .get<Post>(`${this.apiUrl}/${postId}`)
      .pipe(map((post) => this.normalizePost(post)));
  }

  createPostFormData(formData: FormData): Observable<any> {
    return this.http.post<Post>(`${this.apiUrl}`, formData);
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

  // categories
  categoryIds.forEach((id) => formData.append('categoryIds', id));

  const existingMediaIds: string[] = [];
  const removeExistingFlags: string[] = [];
  const replaceExistingFlags: string[] = [];
  const existingDescriptions: string[] = [];

  const newDescriptions: string[] = [];
  const replacementDescriptions: string[] = [];

  for (const block of mediaBlocks) {
    const desc = (block.description || '').trim();

    // ignore removed NEW blocks
    if (!block.id && block.removed) continue;

    // existing media row
    if (block.id) {
      existingMediaIds.push(block.id);

      const isRemoved = !!block.removed;
      removeExistingFlags.push(String(isRemoved));

      const isReplacing = !!block.file && !isRemoved;
      replaceExistingFlags.push(String(isReplacing));

      // backend ignores desc if removed, but still send something safe
      existingDescriptions.push(isRemoved ? (desc || 'removed') : desc);

      if (isReplacing && block.file) {
        formData.append('replacementFiles', block.file);
        replacementDescriptions.push(desc);
      }
      continue;
    }

    // new media
    if (block.file) {
      formData.append('mediaFiles', block.file);
      newDescriptions.push(desc);
    }
  }

  existingMediaIds.forEach((v) => formData.append('existingMediaIds', v));
  removeExistingFlags.forEach((v) => formData.append('removeExistingFlags', v));
  replaceExistingFlags.forEach((v) => formData.append('replaceExistingFlags', v));
  existingDescriptions.forEach((v) => formData.append('existingDescriptions', v));

  newDescriptions.forEach((v) => formData.append('newDescriptions', v));
  replacementDescriptions.forEach((v) => formData.append('replacementDescriptions', v));

  return this.http
    .put<Post>(`${this.apiUrl}/${postId}`, formData)
    .pipe(map((p) => this.normalizePost(p)));
}


  deletePost(postId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${postId}`);
  }

likePost(postId: string): Observable<Post> {
  return this.http
    .post<Post>(`${this.apiUrl}/${postId}/like`, {})
    .pipe(map((p) => this.normalizePost(p)));
}

unlikePost(postId: string): Observable<Post> {
  return this.http
    .delete<Post>(`${this.apiUrl}/${postId}/like`)
    .pipe(map((p) => this.normalizePost(p)));
}

  getUserPosts(userId: string): Observable<Post[]> {
    return this.http
      .get<Post[]>(`${this.apiUrl}/user/${userId}/posts`)
      .pipe(map((posts) => posts.map((p) => this.normalizePost(p))));
  }

  getLikedPosts(userId: string): Observable<Post[]> {
    return this.http
      .get<Post[]>(`${this.apiUrl}/user/${userId}/liked`)
      .pipe(map((posts) => posts.map((p) => this.normalizePost(p))));
  }

  getSavedPosts(userId: string): Observable<Post[]> {
    return this.http
      .get<Post[]>(`${this.apiUrl}/user/${userId}/saved`)
      .pipe(map((posts) => posts.map((p) => this.normalizePost(p))));
  }


  addComment(postId: string, content: string): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/${postId}/comments`, { content });
  }

  getComments(postId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/${postId}/comments`);
  }

  deleteComment(postId: string, commentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${postId}/comments/${commentId}`);
  }
  savePost(postId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${postId}/save`, {});
  }

  unsavePost(postId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${postId}/save`);
  }

  private normalizePost(post: Post): Post {
    post.coverMedia = undefined;

    // ✅ derive excerpt from body 
    const body = (post.body || '').trim();
    (post as any).excerpt = body.length > 160 ? body.slice(0, 160) + '…' : body; // optional if you still want excerpt usage

    if (post.media && post.media.length > 0) {
      // normalize urls + type
      post.media = post.media.map((m) => ({
        ...m,
        url: m.url?.startsWith('http') ? m.url : `${this.base}${m.url}`,
        type: m.mediaType?.startsWith('image')
          ? 'image'
          : m.mediaType?.startsWith('video')
          ? 'video'
          : undefined,
      }));

      // ✅ always pick smallest position (0 is first)
      const sorted = [...post.media].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      post.coverMedia = sorted[0];
    }

    return post;
  }
}
