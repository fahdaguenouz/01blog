import { HttpClient } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private apiUrl: string = "/api/auth";

  constructor(
    private injector: Injector,
    private authService: AuthService,
    private router: Router
  ) {}

  private getHttp(): HttpClient {
    return this.injector.get(HttpClient);
  }

  login(username: string, password: string) {
    return this.getHttp().post<any>(this.apiUrl + "/login", { username, password }).pipe(
      tap((value) => {
        this.authService.setAuth(value.token, value.user?.username || username);
        this.router.navigate(['/feed']);  // ✅ Redirect to feed
      })
    );
  }

  signup(username: string, email: string, password: string) {
    return this.getHttp().post<any>(this.apiUrl + "/register", { username, email, password });
  }

  logout() {
    const token = this.authService.getToken();
    return this.getHttp().post<any>(
      this.apiUrl + "/logout",
      {},
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    ).pipe(
      tap(() => {
        this.authService.clearAuth();
        this.router.navigate(['/']);  // ✅ Redirect to home
      })
    );
  }
}
