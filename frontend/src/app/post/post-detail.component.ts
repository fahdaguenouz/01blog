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
    <mat-card *ngIf="post">
      <div *ngIf="currentUser && post?.authorId === currentUser.id" style="float:right;">
        <button mat-icon-button [matMenuTriggerFor]="menu">
          <mat-icon>more_vert</mat-icon>
        </button>
        <mat-menu #menu="matMenu">
          <button mat-menu-item (click)="onEditPost()">
            <mat-icon>edit</mat-icon>
            Edit
          </button>
          <button mat-menu-item (click)="onDeletePost()">
            <mat-icon>delete</mat-icon>
            Delete
          </button>
        </mat-menu>
      </div>
      <button
        mat-icon-button
        color="warn"
        aria-label="Report this post"
        matTooltip="Report this post"
        (click)="openReportDialog()"
      >
        <mat-icon>warning</mat-icon>
      </button>

      <h2>{{ post.title }}</h2>
      <small>{{ post.createdAt | date : 'medium' }}</small>
      <!-- ADD THIS BLOCK after <small>{{ post.createdAt | date : 'medium' }}</small> -->
      <div class="post-author" style="margin: 12px 0;">
        <div *ngIf="post.media?.length" class="post-media">
          <ng-container *ngFor="let m of post.media || [] | orderByPosition">
            <img
              *ngIf="m.type === 'image'"
              [src]="m.url"
              [alt]="m.description || 'Post image'"
              class="media-item"
            />
            <video *ngIf="m.type === 'video'" controls class="media-item">
              <source [src]="m.url" />
            </video>
            <p *ngIf="m.description" class="media-description">{{ m.description }}</p>
          </ng-container>
        </div>
        <div style="display: inline-block; vertical-align: middle;">
          <a [routerLink]="['/profile', post.authorUsername]" class="author-link">
            <strong>{{ post.authorName }}</strong>
          </a>
          <br />
          <small style="color: #666;">@{{ post.authorUsername }}</small>
        </div>
      </div>

      <div *ngIf="post.categories?.length" style="margin: 8px 0;">
        <span *ngFor="let cat of post.categories" style="margin-right: 6px;" class="category-chip">
          #{{ cat.name }}
        </span>
      </div>
      <img
        *ngIf="post.mediaUrl && post.mediaType === 'image'"
        [src]="post.mediaUrl"
        alt="Post media"
        style="display:block;margin:12px auto;max-width:440px;width:100%;height:auto;object-fit:cover;border-radius:10px;"
      />

      <video
        *ngIf="post.mediaUrl && post.mediaType === 'video'"
        controls
        style="width:100%;max-height:500px;object-fit:cover;margin:12px 0;"
      >
        <source [src]="post.mediaUrl" />
      </video>

      <p>{{ post.body }}</p>

      <mat-card-actions>
        <button mat-button (click)="toggleLike()">
          <mat-icon [color]="post.isLiked ? 'warn' : ''">
            {{ post.isLiked ? 'favorite' : 'favorite_border' }}
          </mat-icon>
          {{ post.likes ?? 0 }}
        </button>
        <button mat-button (click)="toggleSave()" [color]="post?.isSaved ? 'primary' : ''">
          <mat-icon>
            {{ post?.isSaved ? 'bookmark' : 'bookmark_border' }}
          </mat-icon>
          Save
        </button>

        <span>{{ comments.length }} Comments</span>
      </mat-card-actions>

      <div *ngFor="let comment of comments" class="comment">
        <strong>{{ comment.username }}</strong>
        <small>{{ comment.createdAt | date : 'short' }}</small>
        <p>{{ comment.text }}</p>
      </div>

      <form (ngSubmit)="addComment()" #commentForm="ngForm">
        <mat-form-field appearance="fill" class="full-width">
          <textarea
            matInput
            placeholder="Write a comment..."
            [(ngModel)]="newComment"
            name="comment"
            required
          ></textarea>
        </mat-form-field>
        <button mat-raised-button type="submit" [disabled]="commentForm.invalid">
          Add Comment
        </button>
      </form>
    </mat-card>
  `,
  styles: [
    `
      .comment {
        /* existing */
      }
      .full-width {
        /* existing */
      }

      /* ✅ NEW STYLES */
      .post-author {
        display: flex;
        align-items: center;
        margin: 12px 0;
      }
      .author-link {
        text-decoration: none;
        color: #1976d2;
      }
      .author-link:hover {
        text-decoration: underline;
      }
      .author-avatar {
        object-fit: cover;
      }
      .post-media {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin: 12px 0;
      }
      .media-item {
        width: 100%;
        max-width: 600px;
        border-radius: 10px;
        object-fit: cover;
      }
      .media-description {
        font-size: 14px;
        color: #555;
        margin-top: 4px;
      }
    `,
  ],
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
      this.posts
        .updatePost(
          this.post.id,
          result.title,
          result.body,
          result.media ?? undefined,
          result.categoryIds || []
        )
        .subscribe((updated) => {
          this.post = {
            ...this.post!,
            title: updated.title,
            body: updated.body,
            mediaUrl: updated.mediaUrl,
            mediaType: updated.mediaType,
            categories: updated.categories,
          };
        });
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
}
