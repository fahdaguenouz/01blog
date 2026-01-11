import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface AppNotification {
  id: string;
  type: 'POST_LIKED' | 'POST_COMMENTED' | 'POST_SAVED' | 'USER_FOLLOWED';
  actorUsername: string;
  postId?: string;
  createdAt: string;
  seen: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private base = 'http://localhost:8080/api/notifications';

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<AppNotification[]>(this.base);
  }

  markSeen(id: string) {
    return this.http.post(`${this.base}/${id}/seen`, {});
  }
  markUnseen(id: string) {
    return this.http.post(`${this.base}/${id}/unseen`, {});
  }
}
