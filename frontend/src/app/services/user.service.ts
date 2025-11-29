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
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
 private base = environment.apiUrl; 
  private apiUrl = `${this.base}/api/users`;

  constructor(private injector: Injector) {
  }

  private getHttp(): HttpClient {
    return this.injector.get(HttpClient);
  }
  

getProfileByUsername(username: string): Observable<UserProfile> {
  return this.getHttp().get<UserProfile>(
    `${this.base}/api/users/by-username/${username}`
   
  );
}

getCurrentUser(): Observable<UserProfile> {
  return this.getHttp().get<UserProfile>(
    `${this.apiUrl}/me`
  );
}
getFollowers(userId: string): Observable<UserProfile[]> {
  return this.getHttp().get<UserProfile[]>(`${this.apiUrl}/${userId}/followers`, { withCredentials: true });
}

getFollowing(userId: string): Observable<UserProfile[]> {
  return this.getHttp().get<UserProfile[]>(`${this.apiUrl}/${userId}/following`, { withCredentials: true });
}


  updateProfile(data: Partial<UserProfile>): Observable<UserProfile> {
    return this.getHttp().put<UserProfile>(`${this.apiUrl}/me`, data);
  }

subscribe(userId: string): Observable<UserProfile> {
  return this.getHttp().post<UserProfile>(
    `${this.apiUrl}/${userId}/subscribe`,
    {},
    { withCredentials: true }
  );
}

unsubscribe(userId: string): Observable<UserProfile> {
  return this.getHttp().delete<UserProfile>(
    `${this.apiUrl}/${userId}/subscribe`,
    { withCredentials: true }
  );
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
