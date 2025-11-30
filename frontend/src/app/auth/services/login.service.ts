import { HttpClient } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Injectable({ providedIn: 'root' })
export class LoginService {
  private apiUrl = '/api/auth';
  constructor(private injector: Injector, private auth: AuthService, private router: Router) {}
  private getHttp(): HttpClient { return this.injector.get(HttpClient); }

  login(username: string, password: string) {
    return this.getHttp().post<any>(`${this.apiUrl}/login`, { username, password }).pipe(
       tap((response) => {
      this.auth.setAuth({
        token: response.token, 
        username: response.user.username,  
        role: response.role as 'USER' | 'ADMIN' // ADD
      });
  }));
  }

  signupMultipart(payload: {
    name: string; username: string; email: string; password: string; age: number;
    bio?: string; avatar?: File | null;
  }) {
    const form = new FormData();
    form.append('name', payload.name);
    form.append('username', payload.username);
    form.append('email', payload.email);
    form.append('password', payload.password);
    form.append('age', String(payload.age));
    if (payload.bio) form.append('bio', payload.bio);
    if (payload.avatar) form.append('avatar', payload.avatar);
    return this.getHttp().post<any>(`${this.apiUrl}/register`, form);
  }

  logout() {
    const token = this.auth.getToken();
    return this.getHttp().post<any>(`${this.apiUrl}/logout`, {}, { headers: { Authorization: `Bearer ${token}` } })
      .pipe(tap(() => { this.auth.clearAuth(); this.router.navigate(['/']); }));
  }
}
