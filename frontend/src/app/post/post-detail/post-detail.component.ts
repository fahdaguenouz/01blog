import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PostService, Post, Comment } from '../../services/post.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { UserProfile, UserService } from '../../services/user.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { EditPostData, EditPostDialogComponent } from '../edit-post/edit-post-component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReportService } from '../../services/report.service';
import { ReportPostDialogComponent, ReportPostDialogResult } from '../report-dialog.component';
import { OrderByPositionPipe } from '../orderByPosition';
import { AuthService } from '../../services/auth.service';
import { SnackService } from '../../core/snack.service';
import { AdminService } from '../../services/admin.service';

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
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.scss'],
})
export class PostDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private posts = inject(PostService);
  private userService = inject(UserService);
  private reports = inject(ReportService);
  private admin = inject(AdminService);
  private auth = inject(AuthService);
  private snack = inject(SnackService);

  post: Post | null = null;
  comments: Comment[] = [];
  newComment = '';
  currentUser: UserProfile | null = null;
  postNotFound = false;
  hiddenByAdmin = false;
  loadingPost = true;

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
  this.loadingPost = true;
  this.postNotFound = false;
  this.hiddenByAdmin = false;

  this.posts.getById(id).subscribe({
    next: (p) => {
      this.post = p;
      this.hiddenByAdmin = p.status === 'hidden'; // if you ever return it
      this.loadingPost = false;
    },
    error: (err) => {
      console.error('loadPost error', err);
      this.loadingPost = false;

      // ✅ Your backend returns 404 for hidden posts
      if (err.status === 404) {
        // if backend includes message "Post not found" even for hidden,
        // we treat it as hidden banner (because you want that UX)
        this.hiddenByAdmin = true;

        // optional: also mark notFound if you want a different UI sometimes
        // this.postNotFound = true;
      }

      // if you later change backend to 403 for hidden:
      if (err.status === 403) {
        this.hiddenByAdmin = true;
      }
    },
  });
}


 get shouldShowHiddenBanner(): boolean {
  return this.hiddenByAdmin;
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
  canDeleteComment(c: Comment): boolean {
  if (!this.currentUser || !this.post) return false;
  return (
    c.userId === this.currentUser.id ||      // comment owner
    this.post.authorId === this.currentUser.id || // post owner
    this.isAdmin                               // optional (remove if you don’t want admins)
  );
}

onDeleteComment(c: Comment) {
  if (!this.post) return;

  const ok = window.confirm('Delete this comment?');
  if (!ok) return;

  this.posts.deleteComment(this.post.id, c.id).subscribe({
    next: () => {
      // remove locally
      this.comments = this.comments.filter(x => x.id !== c.id);

      // update count UI
      if (this.post && this.post.comments > 0) this.post.comments--;
    },
    error: (err) => {
      console.error('Delete comment failed', err);
      alert('Failed to delete comment');
    },
  });
}

  onEditPost() {
    if (!this.post) return;

    const dialogRef = this.dialog.open<EditPostDialogComponent, EditPostData, EditPostData>(
      EditPostDialogComponent,
      {
        width: '500px',
        data: {
          id: this.post.id,
          title: this.post.title,
          body: this.post.body ?? '',
          mediaBlocks:
            this.post.media?.map((m, idx) => ({
              id: m.id,
              url: m.url,
              description: m.description ?? '',
              position: idx + 1,
            })) || [],
          categoryIds: (this.post.categories || []).map((c) => c.id),
        },
      }
    );

    dialogRef.afterClosed().subscribe((updatedPost) => {
      if (!updatedPost) return;

      // 🔥 Update the post locally (NO REFRESH)
      this.post = {
        ...this.post!,
        ...updatedPost,
      };

      // Optional: update comments count, likes, flags if backend returns them
      this.comments = this.comments; // no-op, just clarity
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

  get isAdmin(): boolean {
    return this.auth.isAdmin();
  }

  get canManagePost(): boolean {
    if (!this.post) return false;
    // owner OR admin
    return !!this.currentUser && (this.currentUser.id === this.post.authorId || this.isAdmin);
  }
  onAdminDeletePost() {
    if (!this.post) return;

    const ok = window.confirm('Admin action:\n\nDelete this post?\nThis cannot be undone.');
    if (!ok) return;

    this.admin.deletePost(this.post.id).subscribe({
      next: () => {
        this.snack.success('Post deleted');
        this.router.navigate(['/feed']);
      },
      error: (err) => {
        console.error('Admin delete failed', err);
        this.snack.error('Failed to delete post.');
      },
    });
  }
}
