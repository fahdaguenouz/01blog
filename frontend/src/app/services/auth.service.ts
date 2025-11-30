// src/app/services/auth.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of } from 'rxjs';

export interface AuthData {
  token: string;
  username: string;
  role?: 'USER' | 'ADMIN'; // ADD THIS
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _isLoggedIn$ = new BehaviorSubject<boolean>(this.hasToken());
  private _authResolved$ = new BehaviorSubject<boolean>(false);
  public readonly authResolved$: Observable<boolean> = this._authResolved$.asObservable();

  // Expose auth status as observable
  public readonly isLoggedIn$: Observable<boolean> = this._isLoggedIn$.asObservable();
  constructor(private injector: Injector) {  // ADD Injector
    this._isLoggedIn$.next(this.hasToken());
    this._authResolved$.next(true);
  }
  setAuth(data: AuthData): void {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('auth-token', data.token);
      if (data.username) window.sessionStorage.setItem('username', data.username);
      if (data.role) window.sessionStorage.setItem('role', data.role);
    }
    this.setCookie('auth-token', data.token, 1);
    if (data.username) this.setCookie('username', data.username, 1);
    this._isLoggedIn$.next(true);

    this._authResolved$.next(true);
  }

  clearAuth(): void {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('auth-token');
      window.sessionStorage.removeItem('username');
      window.sessionStorage.removeItem('role');
    }
    this.deleteCookie('auth-token');
    this.deleteCookie('username');
    this._isLoggedIn$.next(false);
    this._authResolved$.next(true);
  }
   validateAdminRole(): Observable<boolean> {
  const token = this.getToken();
  if (!token) return of(false);
  
  return this.injector.get(HttpClient).get<any>('/api/users/me', {
    headers: { Authorization: `Bearer ${token}` }
  }).pipe(
    map((response: any) => response.role === 'ADMIN'),
    catchError(() => of(false))
  );
}


  getToken(): string | null {
    const ss = typeof window !== 'undefined' ? window.sessionStorage.getItem('auth-token') : null;
    return ss || this.getCookie('auth-token');
  }

  getUsername(): string | null {
    const ssUser = typeof window !== 'undefined' ? window.sessionStorage.getItem('username') : null;
    return ssUser || this.getCookie('username');
  }

  isLoggedIn(): boolean {
    return this._isLoggedIn$.value;
  }

  private hasToken(): boolean {
    return !!this.getToken();
  }

  private setCookie(name: string, value: string, days: number) {
    if (typeof document === 'undefined') return;
    const d = new Date();
    d.setTime(d.getTime() + days * 864e5);
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/`;
  }

  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  private deleteCookie(name: string) {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
  }
  getRole(): 'USER' | 'ADMIN' | null {
    return typeof window !== 'undefined'
      ? (window.sessionStorage.getItem('role') as 'USER' | 'ADMIN' | null)
      : null;
  }

  isAdmin(): boolean {
    return this.getRole() === 'ADMIN';
  }
}
