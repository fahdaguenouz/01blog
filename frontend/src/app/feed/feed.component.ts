import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PostService, Post, Category } from '../services/post.service';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CategoryService } from '../services/category.service';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [ CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatButtonToggleModule
 
      ],
  template: `
    <div *ngIf="!authResolved">
      <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
    </div>

    <div *ngIf="authResolved && loading">
      <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
    </div>

    <div *ngIf="authResolved && !loading" class="feed-container">
      <div class="filter-bar">
        <mat-form-field appearance="fill" class="category-field">
          <mat-label>Category</mat-label>
          <mat-select
            [value]="selectedCategoryId"
            (selectionChange)="onCategoryChange($event.value)"
          >
            <mat-option value="all">All</mat-option>
            <mat-option *ngFor="let c of categories" [value]="c.id">
              {{ c.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-button-toggle-group
          [value]="sort"
          (change)="onSortChange($event.value)"
          aria-label="Sort posts"
          class="sort-toggle"
        >
          <mat-button-toggle value="new">Newest</mat-button-toggle>
          <mat-button-toggle value="likes">Most liked</mat-button-toggle>
          <mat-button-toggle value="saved">Most saved</mat-button-toggle>
        </mat-button-toggle-group>
      </div>

      <div class="posts-list">
        <mat-card
          *ngFor="let post of posts"
          class="post-card"
          appearance="outlined"
          (click)="open(post)"
        >
          <!-- Post Header with Avatar or icon -->
          <mat-card-header class="post-header">
            <div
              mat-card-avatar
              class="post-avatar"
              [ngStyle]="{
                'background-image': post.avatarUrl ? 'url(' + post.avatarUrl + ')' : 'none'
              }"
            >
              <mat-icon *ngIf="!post.avatarUrl">account_circle</mat-icon>
            </div>
            <div class="header-info">
              <mat-card-title class="post-title">
                {{ post.title || 'Untitled' }}
              </mat-card-title>
              <mat-card-subtitle class="post-subtitle">
                <span class="author">{{ post.authorUsername }}</span>
                <span class="separator">•</span>
                <span class="date">{{ post.createdAt | date : 'short' }}</span>
              </mat-card-subtitle>
            </div>
          </mat-card-header>

          <!-- Post Media -->
          <img
            *ngIf="post.mediaUrl && post.mediaType === 'image'"
            mat-card-image
            [src]="post.mediaUrl"
            alt="Post media"
            class="post-image"
          />
          <video
            *ngIf="post.mediaUrl && post.mediaType === 'video'"
            mat-card-image
            controls
            class="post-video"
          >
            <source [src]="post.mediaUrl" />
          </video>

          <!-- Post Content -->
          <mat-card-content class="post-content">
            <p>{{ post.excerpt }}</p>
          </mat-card-content>

          <!-- Post Actions -->
          <mat-card-actions class="post-actions">
            <button
              mat-button
              class="action-btn"
              (click)="toggleLike(post); $event.stopPropagation()"
            >
              <mat-icon [color]="post.isLiked ? 'warn' : ''">
                {{ post.isLiked ? 'favorite' : 'favorite_border' }}
              </mat-icon>
              <span class="action-count">{{ post.likes ?? 0 }}</span>
            </button>
            <button
              mat-button
              class="action-btn"
              (click)="goToPostDetail(post); $event.stopPropagation()"
            >
              <mat-icon>comment</mat-icon>
              <span class="action-count">{{ post.comments ?? 0 }}</span>
            </button>
            <button
              mat-button
              class="action-btn"
              (click)="toggleSave(post); $event.stopPropagation()"
            >
              <mat-icon [color]="post.isSaved ? 'primary' : ''">
                {{ post.isSaved ? 'bookmark' : 'bookmark_border' }}
              </mat-icon>
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [
    `
      .feed-container {
        width: 90%;
        margin: 0 auto;
        padding: 20px;
      }
      .filter-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        gap: 16px;
      }
      .category-field {
        min-width: 220px;
      }
      .sort-toggle {
        white-space: nowrap;
      }
      .posts-list {
        display: grid;
        grid-template-columns: repeat(4, 1fr); /* exactly 4 columns */
        gap: 20px;
      }

      .post-card {
        display: flex;
        flex-direction: column;
        height: 100%;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      .post-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
      }
      .post-header {
        display: flex;
        align-items: flex-start;
        padding: 16px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      }
      .post-avatar {
        width: 48px;
        height: 48px;
        min-width: 48px;
        border-radius: 50%;
        background-color: #e0e0e0;
        background-size: cover;
        background-position: center;
        margin-right: 12px;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .post-avatar mat-icon {
        font-size: 40px;
        color: #666;
      }
      .header-info {
        flex: 1;
      }
      .post-title {
        font-size: 1rem;
        font-weight: 500;
        margin: 0 0 4px 0;
        line-height: 1.4;
      }
      .post-subtitle {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.875rem;
        color: #999;
      }
      .author {
        font-weight: 500;
        color: #333;
      }
      .separator {
        color: #ddd;
      }
      .post-image,
      .post-video {
        width: 100%;
        height: auto;
        max-height: 400px;
        object-fit: cover;
      }
      .post-content {
        padding: 16px;
      }
      .post-content p {
        margin: 0;
        color: #333;
        line-height: 1.6;
      }
      .mat-card-content {
        flex-grow: 1;
      }

      .post-actions {
        margin-top: auto;
        display: flex;
        justify-content: space-around;
        padding: 8px 0;
        border-top: 1px solid rgba(0, 0, 0, 0.05);
      }
      .action-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: #666;
        transition: color 0.2s ease;
      }
      .action-btn:hover {
        color: #667eea;
      }
      .action-count {
        font-size: 0.875rem;
      }
      @media (max-width: 600px) {
        .feed-container {
          padding: 12px;
        }
        .post-header {
          padding: 12px;
        }
        .post-avatar {
          width: 40px;
          height: 40px;
          margin-right: 10px;
        }
        .post-title {
          font-size: 0.95rem;
        }
        .post-content {
          padding: 12px;
        }
      }
      @media (max-width: 1200px) {
        .posts-list {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      @media (max-width: 900px) {
        .posts-list {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 600px) {
        .posts-list {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class FeedComponent implements OnInit {
  posts: Post[] = [];
  loading = true;
  authResolved = false;
  categories: Category[] = [];
  selectedCategoryId: string | 'all' = 'all';
  sort: 'new' | 'likes' | 'saved' = 'new';
  constructor(
    private postService: PostService,
    private auth: AuthService,
    private router: Router,
    private categoryService: CategoryService
  ) {}

  ngOnInit() {
    this.auth.authResolved$.subscribe((resolved) => {
      this.authResolved = resolved;
      if (resolved) {
        if (this.auth.isLoggedIn()) {
          this.loadCategories();
          this.loadFeed();
        } else {
          this.router.navigate(['/auth/login']);
        }
      }
    });
  }
  loadCategories() {
    this.categoryService.list().subscribe({
      next: (cats) => (this.categories = cats),
      error: () => (this.categories = []),
    });
  }

  toggleSave(post: Post) {
    if (post.isSaved) {
      this.postService.unsavePost(post.id).subscribe(() => {
        post.isSaved = false;
      });
    } else {
      this.postService.savePost(post.id).subscribe(() => {
        post.isSaved = true;
      });
    }
  }

  loadFeed() {
    this.loading = true;
    const categoryId = this.selectedCategoryId === 'all' ? undefined : this.selectedCategoryId;

    this.postService.getFeed(categoryId, this.sort).subscribe({
      next: (posts) => {
        this.posts = posts;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }
  onCategoryChange(id: string) {
    this.selectedCategoryId = id as any;
    this.loadFeed();
  }

  onSortChange(sort: 'new' | 'likes' | 'saved') {
    this.sort = sort;
    this.loadFeed();
  }

  toggleLike(post: Post) {
    if (post.isLiked) {
      this.postService.unlikePost(post.id).subscribe(() => {
        post.isLiked = false;
        post.likes = Math.max((post.likes ?? 1) - 1, 0); // Never go below 0
      });
    } else {
      this.postService.likePost(post.id).subscribe(() => {
        post.isLiked = true;
        post.likes = (post.likes ?? 0) + 1;
      });
    }
  }

  goToPostDetail(post: Post) {
    this.router.navigate(['/post', post.id]);
  }

  open(post: Post) {
    this.router.navigate(['/post', post.id]);
  }
}
