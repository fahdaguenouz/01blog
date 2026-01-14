import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { PostService, Post, Category } from '../services/post.service';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CategoryService } from '../services/category.service';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
  ],
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.scss'],
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
        post.likes = Math.max((post.likes ?? 1) - 1, 0);
      });
    } else {
      this.postService.likePost(post.id).subscribe(() => {
        post.isLiked = true;
        post.likes = (post.likes ?? 0) + 1;
      });
    }
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
  snippet(text?: string, max = 160): string {
    const t = (text || '').trim();
    return t.length > max ? t.slice(0, max) + '…' : t;
  }

  goToPostDetail(post: Post) {
    this.router.navigate(['/post', post.id]);
  }

  open(post: Post) {
    this.router.navigate(['/post', post.id]);
  }

  formatDate(date: string | Date): string {
    const d = new Date(date);
    const now = new Date();

    // Normalize to midnight (important!)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const postDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    const diffDays = (today.getTime() - postDay.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
