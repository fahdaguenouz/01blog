import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PostService, Post } from '../services/post.service';
import { Router } from '@angular/router';

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
    ReactiveFormsModule,
  ],
  template: `
    <div class="feed-container">
      <!-- Create post -->
      <mat-card class="create-post-card">
        <mat-card-content>
          <form [formGroup]="postForm" (ngSubmit)="createPost()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>What's on your mind?</mat-label>
              <textarea
                matInput
                formControlName="description"
                rows="3"
                placeholder="Share something..."
              ></textarea>
            </mat-form-field>

            <div class="create-post-actions">
              <button type="button" mat-icon-button (click)="fileInput.click()" aria-label="Attach file">
                <mat-icon>attach_file</mat-icon>
              </button>
              <input
                type="file"
                #fileInput
                hidden
                (change)="onFileSelected($event)"
                accept="image/*,video/*"
              />
              <button type="submit" mat-raised-button color="primary" [disabled]="postForm.invalid">
                Post
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Feed posts -->
      <div class="posts-list">
        <mat-card
          *ngFor="let post of posts"
          class="post-card"
          appearance="outlined"
          (click)="open(post)"
        >
          <mat-card-header>
            <div mat-card-avatar class="avatar"></div>
            <mat-card-title>{{ post.username }}</mat-card-title>
            <mat-card-subtitle>
              {{ post.createdAt | date:'medium' }}
            </mat-card-subtitle>
          </mat-card-header>

          <img
            *ngIf="post.mediaUrl && post.mediaType === 'image'"
            mat-card-image
            [src]="post.mediaUrl"
            alt="Post media"
          />
          <video
            *ngIf="post.mediaUrl && post.mediaType === 'video'"
            controls
            class="post-media"
          >
            <source [src]="post.mediaUrl" />
          </video>

          <mat-card-content>
            <p>{{ post.description }}</p>
          </mat-card-content>

          <mat-card-actions>
            <button mat-button (click)="toggleLike(post); $event.stopPropagation()">
              <mat-icon [color]="post.isLiked ? 'warn' : undefined">
                {{ post.isLiked ? 'favorite' : 'favorite_border' }}
              </mat-icon>
              {{ post.likesCount }}
            </button>
            <button mat-button (click)="$event.stopPropagation()">
              <mat-icon>comment</mat-icon>
              {{ post.commentsCount }}
            </button>
            <button mat-button (click)="$event.stopPropagation()">
              <mat-icon>share</mat-icon>
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .feed-container {
      max-width: 680px;
      margin: 24px auto;
      padding: 16px;
    }
    .create-post-card {
      margin-bottom: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
    }
    .full-width {
      width: 100%;
    }
    .create-post-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
    }
    .posts-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .post-card {
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: pointer;
      border-radius: 12px;
    }
    .post-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .avatar {
      background-image: url('/assets/avatar-placeholder.png');
      background-size: cover;
      background-position: center;
    }
    .post-media, img {
      width: 100%;
      border-radius: 8px;
      margin-top: 8px;
      max-height: 400px;
      object-fit: cover;
    }
    mat-card-actions {
      display: flex;
      justify-content: space-between;
    }
  `],
})
export class FeedComponent implements OnInit {
  posts: Post[] = [];
  postForm: FormGroup;
  selectedFile: File | null = null;

  constructor(private postService: PostService, private fb: FormBuilder, private router: Router) {
    this.postForm = this.fb.group({ description: ['', Validators.required] });
  }

  ngOnInit() {
    this.loadFeed();
  }

  loadFeed() {
    this.postService.getFeed().subscribe({
      next: (posts: Post[]) => this.posts = posts,
      error: () => console.error('Error loading feed'),
    });
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) this.selectedFile = files[0];
  }

  createPost() {
    if (this.postForm.invalid) return;
    const { description } = this.postForm.value;
    this.postService.createPost(description, description, this.selectedFile || undefined).subscribe({
      next: () => {
        this.postForm.reset();
        this.selectedFile = null;
        this.loadFeed();
      },
      error: () => console.error('Error creating post'),
    });
  }

  toggleLike(post: Post) {
    if (post.isLiked) {
      this.postService.unlikePost(post.id).subscribe(() => {
        post.isLiked = false;
        post.likesCount--;
      });
    } else {
      this.postService.likePost(post.id).subscribe(() => {
        post.isLiked = true;
        post.likesCount++;
      });
    }
  }

  open(post: Post) {
    this.router.navigate(['/post', post.id]);
  }
}
