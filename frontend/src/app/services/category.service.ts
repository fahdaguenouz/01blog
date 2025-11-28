// src/app/services/category.service.ts
import { Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from './post.service';
import { environment } from '../../environment/environment';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private base = environment.apiUrl;
  private apiUrl = `${this.base}/api/categories`;
  constructor(private injector: Injector) {}
  private getHttp(): HttpClient {
    return this.injector.get(HttpClient);
  }

  list(): Observable<Category[]> {
    return this.getHttp().get<Category[]>(this.apiUrl);
  }
}
