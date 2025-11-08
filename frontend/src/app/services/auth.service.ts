// src/app/services/auth.service.ts
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({ providedIn: "root" })
export class AuthService {
  private _isLoggedIn$ = new BehaviorSubject<boolean>(this.hasToken());
  private _authResolved$ = new BehaviorSubject<boolean>(false);
public readonly authResolved$: Observable<boolean> = this._authResolved$.asObservable();

  // Expose auth status as observable
  public readonly isLoggedIn$: Observable<boolean> = this._isLoggedIn$.asObservable();
  constructor() {
  // On service initialization, check token presence synchronously:
  this._isLoggedIn$.next(this.hasToken());
  // Emit resolved true immediately for now (implement API token verification if needed)
  this._authResolved$.next(true);
}
  setAuth(token: string, username?: string): void {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem("auth-token", token);
      if (username) window.sessionStorage.setItem("username", username);
    }
    this.setCookie("auth-token", token, 1);
    if (username) this.setCookie("username", username, 1);
    this._isLoggedIn$.next(true);
   
  this._authResolved$.next(true);
  }

  clearAuth(): void {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem("auth-token");
      window.sessionStorage.removeItem("username");
    }
    this.deleteCookie("auth-token");
    this.deleteCookie("username");
    this._isLoggedIn$.next(false);
    this._authResolved$.next(true);
  }

  getToken(): string | null {
    const ss = (typeof window !== 'undefined') ? window.sessionStorage.getItem("auth-token") : null;
    return ss || this.getCookie("auth-token");
  }

  getUsername(): string | null {
    const ssUser = (typeof window !== 'undefined') ? window.sessionStorage.getItem("username") : null;
    return ssUser || this.getCookie("username");
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
}
