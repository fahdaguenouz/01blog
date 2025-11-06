// src/app/services/auth.service.ts
import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class AuthService {
  setAuth(token: string, username?: string): void {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem("auth-token", token);
      if (username) window.sessionStorage.setItem("username", username);
    }
    this.setCookie("auth-token", token, 1);
    if (username) this.setCookie("username", username, 1);
  }

  clearAuth(): void {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem("auth-token");
      window.sessionStorage.removeItem("username");
    }
    this.deleteCookie("auth-token");
    this.deleteCookie("username");
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
