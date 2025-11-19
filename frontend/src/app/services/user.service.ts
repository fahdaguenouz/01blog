import { HttpClient } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Observable } from 'rxjs';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: string;
  postsCount: number;
  subscribersCount: number;
  isSubscribed?: boolean;
  age?: number | null; 
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = '/api/users';

  constructor(private injector: Injector) {}

  private getHttp(): HttpClient {
    return this.injector.get(HttpClient);
  }

 getProfileByUsername(username: string): Observable<UserProfile> {
  return this.getHttp().get<UserProfile>(`/api/users/by-username/${username}`);
}

  getCurrentUser(): Observable<UserProfile> {
    return this.getHttp().get<UserProfile>(`${this.apiUrl}/me`);
  }

  updateProfile(data: Partial<UserProfile>): Observable<UserProfile> {
    return this.getHttp().put<UserProfile>(`${this.apiUrl}/me`, data);
  }

  subscribe(userId: string): Observable<void> {
    return this.getHttp().post<void>(`${this.apiUrl}/${userId}/subscribe`, {});
  }

  unsubscribe(userId: string): Observable<void> {
    return this.getHttp().delete<void>(`${this.apiUrl}/${userId}/subscribe`);
  }

  getSubscriptions(): Observable<UserProfile[]> {
    return this.getHttp().get<UserProfile[]>(`${this.apiUrl}/subscriptions`);
  }

  searchUsers(query: string): Observable<UserProfile[]> {
    return this.getHttp().get<UserProfile[]>(`${this.apiUrl}/search`, { params: { q: query } });
  }
}
