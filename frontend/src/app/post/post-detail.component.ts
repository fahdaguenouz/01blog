import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PostService, Post, Comment } from '../services/post.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { UserProfile, UserService } from '../services/user.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { EditPostData, EditPostDialogComponent } from './edit-post-component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReportService } from '../services/report.service';
import { ReportPostDialogComponent, ReportPostDialogResult } from './report-dialog.component';
import { OrderByPositionPipe } from './orderByPosition';

@Component({
  standalone: true,
  selector: 'app-post-detail',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    MatFormFieldModule,
    FormsModule,
    MatMenuModule,
    MatDialogModule,
    RouterModule,
    MatInputModule,
    MatTooltipModule,
    OrderByPositionPipe,
  ],
  template: `
    <div class="post-detail-wrapper" *ngIf="post">
      <article class="post-detail-container">
        <!-- Post Header -->
        <header class="post-header">
          <h1 class="post-title">{{ post.title }}</h1>

          <!-- Author Section -->
          <div class="author-section">
            <a [routerLink]="['/profile', post.authorUsername]" class="author-link">
              <img
                class="author-avatar"
                [src]="post.avatarUrl || 'svg/avatar.png'"
                alt="author avatar"
              />

              <div class="author-info">
                <span class="author-name">{{ post.authorName }}</span>
                <div class="post-meta">
                  <span class="author-username">@{{ post.authorUsername }}</span>
                  <span class="meta-separator">·</span>
                  <span class="post-date">{{ formatDate(post.createdAt) }}</span>
                  <span class="meta-separator">·</span>
                  
                </div>
              </div>
            </a>

            <!-- Action Buttons -->
            <div class="header-actions">
              <button
                mat-icon-button
                class="report-btn"
                matTooltip="Report this post"
                (click)="openReportDialog()"
              >
                <mat-icon>flag</mat-icon>
              </button>

              <button
                *ngIf="currentUser && post?.authorId === currentUser.id"
                mat-icon-button
                [matMenuTriggerFor]="menu"
                class="more-btn"
              >
                <mat-icon>more_horiz</mat-icon>
              </button>

              <mat-menu #menu="matMenu" class="post-menu">
                <button mat-menu-item (click)="onEditPost()">
                  <mat-icon>edit</mat-icon>
                  <span>Edit Post</span>
                </button>
                <button mat-menu-item (click)="onDeletePost()" class="delete-item">
                  <mat-icon>delete</mat-icon>
                  <span>Delete Post</span>
                </button>
              </mat-menu>
            </div>
          </div>

          <!-- Categories -->
          <div *ngIf="post.categories?.length" class="categories">
            <span *ngFor="let cat of post.categories" class="category-tag">
              {{ cat.name }}
            </span>
          </div>
        </header>

        <!-- Post Media -->
        <div *ngIf="post.media?.length" class="post-media">
          <ng-container *ngFor="let m of post.media | orderByPosition">
            <div class="media-wrapper">
              <img
                *ngIf="m.type === 'image'"
                [src]="m.url"
                [alt]="m.description || 'Post image'"
                class="media-image"
              />

              <video *ngIf="m.type === 'video'" controls class="media-video">
                <source [src]="m.url" />
              </video>

              <p *ngIf="m.description" class="media-caption">
                {{ m.description }}
              </p>
            </div>
          </ng-container>
        </div>

        <!-- Post Content -->
        <div class="post-content">
          <p>{{ post.body }}</p>
        </div>

        <!-- Post Actions -->
        <div class="post-actions">
          <div class="action-buttons">
            <button
              mat-button
              class="action-btn"
              [class.liked]="post.isLiked"
              (click)="toggleLike()"
            >
              <mat-icon>{{ post.isLiked ? 'favorite' : 'favorite_border' }}</mat-icon>
              <span>{{ post.likes ?? 0 }}</span>
            </button>

            <button mat-button class="action-btn">
              <mat-icon>chat_bubble_outline</mat-icon>
              <span>{{ comments.length }}</span>
            </button>
          </div>

          <button
            mat-icon-button
            class="save-btn"
            [class.saved]="post?.isSaved"
            (click)="toggleSave()"
          >
            <mat-icon>{{ post?.isSaved ? 'bookmark' : 'bookmark_border' }}</mat-icon>
          </button>
        </div>

        <!-- Comments Section -->
        <section class="comments-section">
          <h3 class="comments-title">Responses ({{ comments.length }})</h3>

          <!-- Comments List -->
          <div class="comments-list">
            <div *ngFor="let comment of comments" class="comment-item">
              <div class="comment-header">
                <img
                  class="comment-avatar"
                  [src]="comment.avatarUrl || 'svg/avatar.png'"
                  alt="comment avatar"
                />

                <div class="comment-meta">
                  <span class="comment-author">{{ comment.username }}</span>
                  <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
                </div>
              </div>
              <div class="comment-content">
                <p>{{ comment.text }}</p>
              </div>
            </div>

            <div *ngIf="comments.length === 0" class="no-comments">
              <mat-icon>chat_bubble_outline</mat-icon>
              <p>No responses yet</p>
              <span>Be the first to share your thoughts</span>
            </div>

            <!-- Add Comment Form -->
            <form (ngSubmit)="addComment()" #commentForm="ngForm" class="comment-form">
              <div class="comment-input-wrapper">
                <mat-form-field appearance="outline" class="comment-field">
                  <mat-label>Share your thoughts...</mat-label>
                  <textarea
                    matInput
                    [(ngModel)]="newComment"
                    name="comment"
                    required
                    rows="3"
                    placeholder="What are your thoughts?"
                  ></textarea>
                </mat-form-field>
              </div>
              <div class="comment-actions">
                <button
                  mat-flat-button
                  color="primary"
                  type="submit"
                  [disabled]="commentForm.invalid"
                  class="submit-comment-btn"
                >
                  Respond
                </button>
              </div>
            </form>
          </div>
        </section>
      </article>
    </div>
  `,
  styleUrls: ['./post-detail.component.scss'],
})
export class PostDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private posts = inject(PostService);
  private userService = inject(UserService);
  private reports = inject(ReportService);
  post: Post | null = null;
  comments: Comment[] = [];
  newComment = '';
  currentUser: UserProfile | null = null;
  private dialog = inject(MatDialog);
  private router = inject(Router);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadPost(id);
    this.loadComments(id);

    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
      },
      error: (err) => {
        console.error('getCurrentUser error', err);
        this.currentUser = null;
      },
    });
  }

  loadPost(id: string) {
    this.posts.getById(id).subscribe((p) => {
      this.post = p;
      console.log('Loaded post:', p);
    });
  }

  loadComments(postId: string) {
    this.posts.getComments(postId).subscribe((comments) => (this.comments = comments));
  }

  toggleLike() {
    if (!this.post) return;
    if (this.post.isLiked) {
      this.posts.unlikePost(this.post.id).subscribe(() => {
        if (this.post) {
          this.post.isLiked = false;
          this.post.likes--;
        }
      });
    } else {
      this.posts.likePost(this.post.id).subscribe(() => {
        if (this.post) {
          this.post.isLiked = true;
          this.post.likes++;
        }
      });
    }
  }

  toggleSave() {
    if (!this.post) return;

    if (this.post.isSaved) {
      this.posts.unsavePost(this.post.id).subscribe(() => {
        if (this.post) this.post.isSaved = false;
      });
    } else {
      this.posts.savePost(this.post.id).subscribe(() => {
        if (this.post) this.post.isSaved = true;
      });
    }
  }

  addComment() {
    if (!this.post || !this.newComment.trim()) return;
    this.posts.addComment(this.post.id, this.newComment.trim()).subscribe({
      next: (comment) => {
        this.comments.unshift(comment);
        this.loadComments(this.post!.id);
        if (this.post) this.post.comments++;
        this.newComment = '';
      },
      error: () => alert('Failed to add comment'),
    });
  }

  onEditPost() {
    if (!this.post) return;

    const dialogRef = this.dialog.open<EditPostDialogComponent, EditPostData, EditPostData>(
      EditPostDialogComponent,
      {
        width: '500px',
        data: {
          title: this.post.title,
          body: this.post.body ?? '',
          media: null,
          categoryIds: (this.post.categories || []).map((c) => c.id),
        },
      }
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (!result || !this.post) return;
      console.log('update categoryIds', result.categoryIds);
    });
  }

  onDeletePost() {
    if (!this.post) return;

    const confirmed = window.confirm(
      'Do you really want to delete your post?\n\nWarning: all comments and likes will be removed.'
    );
    if (!confirmed) return;

    this.posts.deletePost(this.post.id).subscribe({
      next: () => this.router.navigate(['/feed']),
      error: (err) => {
        console.error('Delete failed', err);
        alert('Failed to delete post: ' + (err.status || 'unknown error'));
      },
    });
  }

  openReportDialog() {
    if (!this.post || !this.currentUser) {
      alert('You must be logged in to report a post.');
      return;
    }

    const dialogRef = this.dialog.open<
      ReportPostDialogComponent,
      { authorName: string; postTitle: string },
      ReportPostDialogResult
    >(ReportPostDialogComponent, {
      width: '420px',
      data: {
        authorName: this.post.authorName,
        postTitle: this.post.title,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;

      this.reports
        .reportPost({
          reportedUserId: this.post!.authorId,
          reportedPostId: this.post!.id,
          category: result.category,
          reason: result.reason,
        })
        .subscribe({
          next: () => alert('Thank you. Your report has been submitted.'),
          error: () => alert('Failed to submit report. Please try again later.'),
        });
    });
  }

  formatDate(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

}
