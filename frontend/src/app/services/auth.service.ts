import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom, of } from 'rxjs';
import { catchError, map, take, tap, timeout } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environment/environment';

export interface AuthData {
  token: string;
}

export interface CurrentUser {
  id: string;
  username: string;
  role: 'USER' | 'ADMIN';
  name?: string;
  avatarUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'auth-token';
  private readonly meUrl = `${environment.apiUrl}/api/users/me`;

  private _me$ = new BehaviorSubject<CurrentUser | null>(null);
  readonly me$ = this._me$.asObservable(); //readonly

  private _isAuthed$ = new BehaviorSubject<boolean>(this.hasToken());
  readonly isAuthed$ = this._isAuthed$.asObservable();

  constructor(private http: HttpClient, private router: Router) {

  }

  private readToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  private writeToken(token: string | null) {
    if (token) sessionStorage.setItem(this.TOKEN_KEY, token);
    else sessionStorage.removeItem(this.TOKEN_KEY);
  }

  hasToken(): boolean {
    return !!this.readToken();
  }

  getToken(): string | null {
    return this.readToken();
  }

  private setToken(token: string | null) {
    this.writeToken(token);
    this._isAuthed$.next(!!token);
  }

  async setAuth(data: AuthData): Promise<CurrentUser | null> {
    this.setToken(data.token);

    const me = await firstValueFrom(this.refreshMe().pipe(take(1)));
    if (!me) this.clearAuth();
    return me;
  }

  clearAuth(): void {
    this.setToken(null);
    this._me$.next(null);
  }

  forceLogout(reason: 'banned' | 'expired' | 'invalid' | 'conflict' = 'invalid'): void {
    this.clearAuth();
    this.router.navigate(['/auth/login'], { queryParams: { reason } });
  }

  refreshMe(): Observable<CurrentUser | null> {
    if (!this.hasToken()) {
      this._me$.next(null);
      this._isAuthed$.next(false);
      return of(null);
    }
    
    return this.http.get<CurrentUser>(this.meUrl).pipe(
      timeout(8000),
      take(1),
      tap((me) => {
        this._me$.next(me ?? null);
        this._isAuthed$.next(!!me); //  authed only if /me succeeded
      }),
      map((me) => me ?? null),
      catchError((err: unknown) => {
        // invalid token => clear it so guards/UI stop thinking logged in
        if (err instanceof HttpErrorResponse && (err.status === 401 || err.status === 403)) {
          this.clearAuth();
          return of(null);
        }
        this._me$.next(null);
        this._isAuthed$.next(false);
        return of(null);
      })
    );
  }

  isLoggedIn(): boolean {
    return this._isAuthed$.value;
  }

  isAdmin(): boolean {
    return this._me$.value?.role === 'ADMIN';
  }

  getUsername(): string | null {
    return this._me$.value?.username ?? null;
  }

  validateAdminRole(): Observable<boolean> {
    const cached = this._me$.value;
    if (cached) return of(cached.role === 'ADMIN');

    return this.refreshMe().pipe(map((me) => me?.role === 'ADMIN'));
  }
}
