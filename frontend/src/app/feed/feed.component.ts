import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PostService, Post } from '../services/post.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="feed-container">
      <!-- Create Post Card -->
      <mat-card class="create-post-card">
        <mat-card-content>
          <form [formGroup]="postForm" (ngSubmit)="createPost()">
            <mat-form-field class="full-width">
              <mat-label>What's on your mind?</mat-label>
              <textarea matInput formControlName="description" rows="4" placeholder="Share your learning..."></textarea>
            </mat-form-field>
            <input type="file" #fileInput hidden (change)="onFileSelected($event)" accept="image/*,video/*">
            <div class="create-post-actions">
              <button type="button" mat-icon-button (click)="fileInput.click()">
                <mat-icon>attach_file</mat-icon>
              </button>
              <button type="submit" mat-raised-button color="primary" [disabled]="postForm.invalid">
                Post
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Posts Feed -->
      <div class="posts-list">
        <mat-card *ngFor="let post of posts" class="post-card">
          <mat-card-header>
            <div class="post-header">
              <div>
                <strong>{{ post.username }}</strong>
                <small>{{ post.createdAt | date:'short' }}</small>
              </div>
            </div>
          </mat-card-header>

          <mat-card-content>
            <p>{{ post.description }}</p>
            <img *ngIf="post.mediaUrl && post.mediaType === 'image'" [src]="post.mediaUrl" alt="Post media">
            <video *ngIf="post.mediaUrl && post.mediaType === 'video'" controls width="100%">
              <source [src]="post.mediaUrl">
            </video>
          </mat-card-content>

          <mat-card-actions>
            <button mat-button (click)="toggleLike(post)">
              <mat-icon [color]="post.isLiked ? 'warn' : ''">
                {{ post.isLiked ? 'favorite' : 'favorite_border' }}
              </mat-icon>
              {{ post.likesCount }}
            </button>
            <button mat-button>
              <mat-icon>comment</mat-icon>
              {{ post.commentsCount }}
            </button>
            <button mat-button>
              <mat-icon>share</mat-icon>
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .feed-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }

    .create-post-card {
      margin-bottom: 24px;
    }

    .full-width {
      width: 100%;
    }

    .create-post-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 16px;
    }

    .posts-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .post-card {
      margin-bottom: 16px;
    }

    .post-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;

      div {
        display: flex;
        flex-direction: column;
        gap: 4px;

        small {
          color: #999;
          font-size: 0.85rem;
        }
      }
    }

    img, video {
      width: 100%;
      border-radius: 8px;
      margin-top: 12px;
      max-height: 400px;
      object-fit: cover;
    }
  `]
})
export class FeedComponent implements OnInit {
  posts: Post[] = [];
  postForm: FormGroup;
  selectedFile: File | null = null;

  constructor(
    private postService: PostService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this.postForm = this.fb.group({
      description: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadFeed();
  }

  loadFeed() {
    this.postService.getFeed().subscribe({
      next: (posts) => {
        this.posts = posts;
      },
      error: () => {
        this.toastr.error('Failed to load feed');
      }
    });
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
    }
  }

  createPost() {
    if (this.postForm.invalid) return;

    const { description } = this.postForm.value;
    this.postService.createPost(description, description, this.selectedFile || undefined).subscribe({
      next: () => {
        this.toastr.success('Post created successfully!');
        this.postForm.reset();
        this.selectedFile = null;
        this.loadFeed();
      },
      error: () => {
        this.toastr.error('Failed to create post');
      }
    });
  }

  toggleLike(post: Post) {
    if (post.isLiked) {
      this.postService.unlikePost(post.id).subscribe({
        next: () => {
          post.isLiked = false;
          post.likesCount--;
        }
      });
    } else {
      this.postService.likePost(post.id).subscribe({
        next: () => {
          post.isLiked = true;
          post.likesCount++;
        }
      });
    }
  }
}
