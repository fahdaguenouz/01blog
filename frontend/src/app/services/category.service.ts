import { Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from './post.service';
import { environment } from '../../environment/environment';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private base = environment.apiUrl;
  private apiUrl = `${this.base}/api/categories`;
  constructor(private http: HttpClient) {}

  list(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl);
  }
}
