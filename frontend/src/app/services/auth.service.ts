// import { Injectable } from "@angular/core"
// import type { HttpClient } from "@angular/common/http"
// import { BehaviorSubject, type Observable } from "rxjs"
// import { tap } from "rxjs/operators"

// export interface User {
//   id: string
//   email: string
//   name: string
//   avatar?: string
//   bio?: string
//   role: "USER" | "ADMIN"
// }

// export interface AuthResponse {
//   token: string
//   user: User
// }

// @Injectable({
//   providedIn: "root",
// })
// export class AuthService {
//   private apiUrl = "http://localhost:8080/api/auth"
//   private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage())
//   public currentUser$ = this.currentUserSubject.asObservable()

//   constructor(private http: HttpClient) {}

//   login(email: string, password: string): Observable<AuthResponse> {
//     return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
//       tap((response) => {
//         localStorage.setItem("token", response.token)
//         localStorage.setItem("user", JSON.stringify(response.user))
//         this.currentUserSubject.next(response.user)
//       }),
//     )
//   }

//   register(name: string, email: string, password: string): Observable<AuthResponse> {
//     return this.http.post<AuthResponse>(`${this.apiUrl}/register`, { name, email, password }).pipe(
//       tap((response) => {
//         localStorage.setItem("token", response.token)
//         localStorage.setItem("user", JSON.stringify(response.user))
//         this.currentUserSubject.next(response.user)
//       }),
//     )
//   }

//   logout(): void {
//     localStorage.removeItem("token")
//     localStorage.removeItem("user")
//     this.currentUserSubject.next(null)
//   }

//   getToken(): string | null {
//     return localStorage.getItem("token")
//   }

//   getCurrentUser(): User | null {
//     return this.currentUserSubject.value
//   }

//   private getUserFromStorage(): User | null {
//     const user = localStorage.getItem("user")
//     return user ? JSON.parse(user) : null
//   }

//   isLoggedIn(): boolean {
//     return !!this.getToken()
//   }

//   isAdmin(): boolean {
//     return this.currentUserSubject.value?.role === "ADMIN"
//   }
// }
