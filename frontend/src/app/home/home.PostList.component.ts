import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { HomePost, HomePostCardComponent } from './home.post';

@Component({
  selector: 'app-home-post-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, HomePostCardComponent],
  template: `
    <section class="posts-wrap">
      <div class="posts-grid">
        <app-home-post-card *ngFor="let p of posts" [post]="p"></app-home-post-card>
      </div>
      <div class="pager">
        <button mat-flat-button color="primary" (click)="goToLogin()" class="load-more-btn">
          Sign in to see more stories
        </button>
      </div>
    </section>
  `,
  styles: [`
    .posts-wrap { 
      margin-top: 24px; 
    }
    
    .posts-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
    }
    
    .pager { 
      display: flex; 
      justify-content: center; 
      margin-top: 48px;
      padding: 32px 0;
      border-top: 1px solid rgba(123, 84, 47, 0.1);
      
      .load-more-btn {
        height: 44px;
        padding: 0 32px;
        border-radius: 22px;
        font-size: 15px;
        font-weight: 500;
      }
    }
  `]
})
export class HomePostListComponent implements OnInit {
  posts: HomePost[] = [];

  constructor(private router: Router) {}

  ngOnInit() { 
    this.generateMockPosts();
  }

  generateMockPosts() {
    const titles = [
      'Getting Started with Angular Signals: A Complete Guide',
      'Mastering RxJS Operators for Better Reactive Programming',
      'Building Scalable Web Applications with Micro-Frontends',
      'The Future of TypeScript: What\'s Coming in 2024',
      'Creating Stunning UI Animations with CSS and Angular',
      'Understanding Dependency Injection in Modern Frameworks',
      'Best Practices for State Management in Large Applications'
    ];

    const excerpts = [
      'Angular Signals represent a new reactive primitive that brings fine-grained reactivity to Angular applications. Learn how to leverage this powerful feature to build more efficient and maintainable applications...',
      'RxJS is the backbone of reactive programming in Angular. Discover the most useful operators and learn when and how to apply them in real-world scenarios for cleaner, more efficient code...',
      'Micro-frontends are revolutionizing how we build large-scale applications. This comprehensive guide walks you through the architecture, benefits, and implementation strategies...',
      'TypeScript continues to evolve with exciting features that make development more productive and enjoyable. Explore what\'s on the horizon and how it will impact your development workflow...',
      'Animation brings life to user interfaces. Learn how to create smooth, performant animations that enhance user experience without sacrificing performance using modern CSS techniques...',
      'Dependency injection is a fundamental pattern in modern application development. Deep dive into how it works and why it\'s essential for building testable, maintainable code...',
      'Managing state in large applications can be challenging. Explore different state management patterns and learn how to choose the right approach for your specific needs...'
    ];

    const authors = [
      'Sarah Chen',
      'Michael Rodriguez',
      'Priya Patel',
      'James Wilson',
      'Emily Thompson',
      'David Kim',
      'Maria Garcia'
    ];

    const dates = [
      new Date(2024, 0, 10),
      new Date(2024, 0, 9),
      new Date(2024, 0, 8),
      new Date(2024, 0, 7),
      new Date(2024, 0, 6),
      new Date(2024, 0, 5),
      new Date(2024, 0, 4)
    ];

    this.posts = titles.map((title, index) => ({
      id: index + 1,
      title: title,
      body: excerpts[index],
      authorName: authors[index],
      createdAt: dates[index],
      likesCount: Math.floor(Math.random() * 500) + 50,
      commentsCount: Math.floor(Math.random() * 100) + 10
    }));
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}