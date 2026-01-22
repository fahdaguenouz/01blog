// src/app/auth/services/login.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environment/environment';

@Injectable({ providedIn: 'root' })
export class LoginService {
  private readonly apiUrl = `${environment.apiUrl}/api/auth`;
  constructor(private http: HttpClient) {}
  private normStr(v: string): string {
    return (v ?? '').trim().toLowerCase();
  }
 login(username: string, password: string) {
    return this.http.post<{ token: string }>(`${this.apiUrl}/login`, {
      username: this.normStr(username),
      password, 
    });
  }
  logout() {
    return this.http.post(`${this.apiUrl}/logout`, {});
  }
  signupMultipart(payload: {
    name: string;
    username: string;
    email: string;
    password: string;
    age: number;
    bio?: string;
    avatar?: File | null;
  }) {
    const form = new FormData();
     form.append('name', this.normStr(payload.name));
    form.append('username', this.normStr(payload.username));
    form.append('email', this.normStr(payload.email));
    form.append('password', payload.password);
    form.append('age', String(payload.age));
    if (payload.bio) form.append('bio', payload.bio);
    if (payload.avatar) form.append('avatar', payload.avatar);

    return this.http.post<any>(`${this.apiUrl}/register`, form);
  }
}
