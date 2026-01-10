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
  templateUrl: `./feed.component.html`,
  styleUrls: [
    `./feed.component.css`,
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
        // console.log("the post info in feed ",posts);
        
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
