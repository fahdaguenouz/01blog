import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class AuthService {
  setAuth(token: string, username?: string): void {
    sessionStorage.setItem("auth-token", token);
    if (username) sessionStorage.setItem("username", username);
    this.setCookie("auth-token", token, 1);
    if (username) this.setCookie("username", username, 1);
  }

  clearAuth(): void {
    sessionStorage.removeItem("auth-token");
    sessionStorage.removeItem("username");
    this.deleteCookie("auth-token");
    this.deleteCookie("username");
  }

  getToken(): string | null {
    return sessionStorage.getItem("auth-token") || this.getCookie("auth-token");
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private setCookie(name: string, value: string, days: number) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/`;
  }

  private getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  private deleteCookie(name: string) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
}
