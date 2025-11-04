import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { tap } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  apiUrl: string = "/api/auth"

  constructor(private httpClient: HttpClient, private authService: AuthService) { }

  login(username: string, password: string){
    return this.httpClient.post<any>(this.apiUrl + "/login", { username, password }).pipe(
      tap((value) => {
        this.authService.setAuth(value.token, value.user?.username || username)
      })
    )
  }

  signup(username: string, email: string, password: string){
    // backend returns User, no token
    return this.httpClient.post<any>(this.apiUrl + "/register", { username, email, password })
  }
}
