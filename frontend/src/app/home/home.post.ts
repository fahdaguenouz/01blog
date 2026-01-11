import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

export interface HomePost {
  id: number;
  title: string;
  body: string;
  authorName: string;
  createdAt: Date;
  likesCount: number;
  commentsCount: number;
}

@Component({
  selector: 'app-home-post-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <article class="post-card" (click)="goLogin()">
      <div class="post-header">
        <div class="author-info">
          <div class="author-avatar"></div>
          <div class="author-details">
            <span class="author-name">{{ post.authorName }}</span>
            <span class="post-date">{{ formatDate(post.createdAt) }}</span>
          </div>
        </div>
      </div>

      <div class="post-content">
        <h2 class="post-title">{{ post.title }}</h2>
        <p class="post-excerpt">{{ getExcerpt(post.body) }}</p>
      </div>

      <div class="post-footer">
        <div class="post-actions">
          <button mat-button class="action-btn" (click)="handleAction($event)">
            <mat-icon>favorite_border</mat-icon>
            <span>{{ post.likesCount }}</span>
          </button>
          <button mat-button class="action-btn" (click)="handleAction($event)">
            <mat-icon>chat_bubble_outline</mat-icon>
            <span>{{ post.commentsCount }}</span>
          </button>
        </div>
        <span class="read-time">5 min read</span>
      </div>
    </article>
  `,
  styles: [`
    .post-card {
      padding: 24px 0;
      border-bottom: 1px solid rgba(123, 84, 47, 0.1);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        .post-title {
          color: #FF9D00;
        }
      }
    }

    .post-header {
      margin-bottom: 16px;
    }

    .author-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .author-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #FF9D00, #B6771D);
    }

    .author-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .author-name {
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }

    .post-date {
      font-size: 13px;
      color: #757575;
    }

    .post-content {
      margin-bottom: 16px;
    }

    .post-title {
      font-size: 22px;
      font-weight: 700;
      color: #333;
      margin: 0 0 8px;
      line-height: 1.3;
      transition: color 0.2s ease;
    }

    .post-excerpt {
      font-size: 16px;
      color: #555;
      line-height: 1.6;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .post-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .post-actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      min-width: auto;
      padding: 0 12px;
      height: 32px;
      color: #757575;
      font-size: 14px;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        margin-right: 4px;
      }

      &:hover {
        background: rgba(255, 157, 0, 0.08);
        color: #FF9D00;
      }
    }

    .read-time {
      font-size: 13px;
      color: #757575;
    }

    @media (max-width: 768px) {
      .post-card {
        padding: 20px 0;
      }

      .post-title {
        font-size: 20px;
      }

      .post-excerpt {
        font-size: 15px;
        -webkit-line-clamp: 2;
      }
    }
  `]
})
export class HomePostCardComponent {
  @Input() post!: HomePost;

  constructor(private router: Router) {}

  goLogin() {
    this.router.navigateByUrl('/auth/login');
  }

  handleAction(event: Event) {
    event.stopPropagation();
    this.goLogin();
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  getExcerpt(body: string): string {
    if (!body) return '';
    const maxLength = 150;
    if (body.length <= maxLength) return body;
    return body.substring(0, maxLength).trim() + '...';
  }
}