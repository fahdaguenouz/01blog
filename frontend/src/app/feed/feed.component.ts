import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Router } from '@angular/router';

import { PostService, Post, Category } from '../services/post.service';
import { AuthService } from '../services/auth.service';
import { CategoryService } from '../services/category.service';

import { catchError, finalize, of, take, timeout } from 'rxjs';

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
  categories: Category[] = [];

  loading = true;
  authResolved = false;

  selectedCategoryId: string | 'all' = 'all';
  sort: 'new' | 'likes' | 'saved' = 'new';

  constructor(
    private postService: PostService,
    private auth: AuthService,
    private router: Router,
    private categoryService: CategoryService,
    private cd: ChangeDetectorRef,
    private zone: NgZone,
  ) {}

  ngOnInit() {
    console.log('[Feed] ngOnInit');

    // Start in loading until auth + feed done
    this.loading = true;
    this.authResolved = false;
    this.forceRender();

    this.auth
      .refreshMe()
      .pipe(take(1), timeout(8000))
      .subscribe({
        next: (me) => {
          console.log('[Feed] refreshMe result:', me);

          // ✅ IMPORTANT: mark auth as resolved so template can show
          this.authResolved = true;
          this.forceRender();

          if (!me) {
            console.warn('[Feed] no me => redirect to login');
            this.loading = false;
            this.forceRender();
            this.router.navigate(['/auth/login']);
            return;
          }

          this.loadCategories();
          this.loadFeed();
        },
        error: (err) => {
          console.error('[Feed] refreshMe ERROR:', err);
          this.authResolved = true;
          this.loading = false;
          this.forceRender();
          this.router.navigate(['/auth/login']);
        },
      });
  }

  private forceRender() {
    // Force update even if callback happened outside Angular zone.
    this.zone.run(() => {
      try {
        this.cd.detectChanges();
      } catch {
        this.cd.markForCheck();
      }
    });
  }

  loadCategories() {
    console.log('[Feed] loadCategories...');
    this.categoryService
      .list()
      .pipe(
        timeout(8000),
        catchError((err) => {
          console.error('[Feed] categories ERROR:', err);
          return of([] as Category[]);
        }),
      )
      .subscribe((cats) => {
        console.log('[Feed] categories OK:', cats.length);
        this.categories = cats ?? [];
        this.forceRender();
      });
  }

  loadFeed() {
    console.log('[Feed] loadFeed start', {
      selectedCategoryId: this.selectedCategoryId,
      sort: this.sort,
    });

    this.loading = true;
    this.forceRender();

    const categoryId = this.selectedCategoryId === 'all' ? undefined : this.selectedCategoryId;

    this.postService
      .getFeed(categoryId, this.sort)
      .pipe(
        timeout(10000),
        catchError((err) => {
          console.error('[Feed] feed ERROR:', err);
          return of([] as Post[]);
        }),
        finalize(() => {
          console.log('[Feed] loadFeed finalize => stop loading');
          this.loading = false;
          this.forceRender();
        }),
      )
      .subscribe((posts) => {
        console.log('[Feed] feed OK:', posts.length);
        this.posts = posts ?? [];
        this.forceRender();
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
    const req$ = post.isLiked
      ? this.postService.unlikePost(post.id)
      : this.postService.likePost(post.id);

    req$.subscribe({
      next: (updated) => {
        // update the same object so the UI changes immediately
        post.isLiked = updated.isLiked;
        post.likes = updated.likes;
        this.forceRender();
      },
      error: (err) => {
        console.error('toggleLike failed', err);
        this.forceRender();
      },
    });
  }

  toggleSave(post: Post) {
    if (post.isSaved) {
      this.postService.unsavePost(post.id).subscribe(() => {
        post.isSaved = false;
        this.forceRender();
      });
    } else {
      this.postService.savePost(post.id).subscribe(() => {
        post.isSaved = true;
        this.forceRender();
      });
    }
  }

  snippet(text?: string, max = 160): string {
    const t = (text || '').trim();
    return t.length > max ? t.slice(0, max) + '…' : t;
  }

  open(post: Post) {
    this.router.navigate(['/post', post.id]);
  }

  goToPostDetail(post: Post) {
    this.router.navigate(['/post', post.id]);
  }

  formatDate(date: string | Date): string {
    const d = new Date(date);
    const now = new Date();

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
