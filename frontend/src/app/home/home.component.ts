import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HomePostListComponent } from './home.PostList.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    RouterModule,
    HomePostListComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class Home {
  trendingTitles = [
    'How to Build Your First Angular Application',
    'The Art of Writing Clean Code',
    'Understanding TypeScript Generics',
    'Modern Web Design Principles',
    'JavaScript ES2024 Features You Should Know',
    'Building Scalable Applications with RxJS'
  ];

  constructor(private router: Router) {}

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  getTrendingTitle(index: number): string {
    return this.trendingTitles[index] || 'Interesting Article Title';
  }
}