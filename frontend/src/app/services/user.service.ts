import { HttpClient } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: string;
  postsCount: number;
  subscribersCount: number; // followers count
  subscriptionsCount?: number; // following count (add from backend)
  isSubscribed?: boolean; // whether current user follows this profile
  subscribed?: boolean;
  age?: number | null;
  role?: 'USER' | 'ADMIN';
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private base = environment.apiUrl;
  private apiUrl = `${this.base}/api/users`;

  constructor(private http: HttpClient) {}

  getProfileByUsername(username: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.base}/api/users/username/${username}`);
  }

  getCurrentUser(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me`);
  }

  getFollowers(userId: string): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(`${this.apiUrl}/${userId}/followers`);
  }

  getFollowing(userId: string): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(`${this.apiUrl}/${userId}/following`);
  }

  updateProfile(data: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/me`, data);
  }

  subscribe(userId: string): Observable<UserProfile> {
    return this.http.post<UserProfile>(`${this.apiUrl}/${userId}/subscribe`, {});
  }
  unsubscribe(userId: string): Observable<UserProfile> {
    return this.http.delete<UserProfile>(`${this.apiUrl}/${userId}/subscribe`);
  }

  getSubscriptions(): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(`${this.apiUrl}/subscriptions`);
  }

  searchUsers(query: string): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(`${this.apiUrl}/search`, { params: { q: query } });
  }
  uploadAvatar(formData: FormData): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/me/avatar`, formData);
  }
}
