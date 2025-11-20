import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
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
    MatDialogModule, // dialog
    MatInputModule,
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

      <h2>{{ post.title }}</h2>
      <small>{{ post.createdAt | date : 'medium' }}</small>

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
        margin-top: 1rem;
        padding: 0.5rem;
        background: #f0f0f0;
        border-radius: 4px;
      }
      .full-width {
        width: 100%;
      }
    `,
  ],
})
export class PostDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private posts = inject(PostService);
  private userService = inject(UserService);
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
        console.log('currentUser', user);
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
      console.log('loaded post', p);
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
}
