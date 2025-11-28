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
  age?: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
 private base = environment.apiUrl; 
  private apiUrl = `${this.base}/api/users`;

  constructor(private injector: Injector) {
      console.log('ENV apiUrl (service):', this.base);
  }

  private getHttp(): HttpClient {
    return this.injector.get(HttpClient);
  }
  

getProfileByUsername(username: string): Observable<UserProfile> {
  return this.getHttp().get<UserProfile>(
    `${this.base}/api/users/by-username/${username}`,
    { withCredentials: true }
  );
}

getCurrentUser(): Observable<UserProfile> {
  return this.getHttp().get<UserProfile>(
    `${this.apiUrl}/me`,
    { withCredentials: true }
  );
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
  uploadAvatar(formData: FormData): Observable<void> {
    return this.getHttp().post<void>(`${this.apiUrl}/me/avatar`, formData);
  }
}
