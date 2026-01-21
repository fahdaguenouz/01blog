import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
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
import { Subject, takeUntil } from 'rxjs';
import { ConfirmDialogComponent } from '../../admin/users/ConfirmDialogComponent';

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
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  post: Post | null = null;
  comments: Comment[] = [];
  newComment = '';
  currentUser: UserProfile | null = null;
  isAdmin = false;

  postNotFound = false;
  hiddenByAdmin = false;
  loadingPost = true;
  private destroy$ = new Subject<void>();

  ngOnInit() {
    // current user
    this.userService.getCurrentUser().subscribe({
      next: (user) => (this.currentUser = user),
      error: () => (this.currentUser = null),
    });

    // admin check
    this.auth.validateAdminRole().subscribe((v: boolean) => (this.isAdmin = v));

    // ✅ IMPORTANT: react to /post/:id changes
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = params.get('id');
      if (!id) return;

      // optional: reset state so UI updates immediately
      this.post = null;
      this.comments = [];
      this.loadingPost = true;
      this.hiddenByAdmin = false;
      this.postNotFound = false;

      this.loadPost(id);
      this.loadComments(id);
    });
  }

  loadPost(id: string) {
    this.loadingPost = true;
    this.postNotFound = false;
    this.hiddenByAdmin = false;

    this.posts.getById(id).subscribe({
      next: (p) => {
        // ✅ normalize so template never crashes when media becomes empty
        this.post = {
          ...p,
          media: p.media ?? [],
        };
        this.hiddenByAdmin = p.status === 'hidden';
        this.loadingPost = false;
      },
      error: (err) => {
        console.error('loadPost error', err);
        this.loadingPost = false;

        if (err.status === 404) {
          this.hiddenByAdmin = true;
        }
        if (err.status === 403) {
          this.hiddenByAdmin = true;
        }
      },
    });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get shouldShowHiddenBanner(): boolean {
    return this.hiddenByAdmin;
  }

  loadComments(postId: string) {
    this.posts.getComments(postId).subscribe({
      next: (comments) => {
        this.comments = [...comments]; // ✅ new reference
        this.cdr.detectChanges(); // ✅ force repaint
      },
      error: (err) => console.error('loadComments failed', err),
    });
  }

  toggleLike() {
    if (!this.post) return;

    if (this.post.isLiked) {
      this.posts.unlikePost(this.post.id).subscribe(() => {
        if (!this.post) return;
        this.post.isLiked = false;
        this.post.likes = Math.max(0, (this.post.likes ?? 0) - 1);
      });
    } else {
      this.posts.likePost(this.post.id).subscribe(() => {
        if (!this.post) return;
        this.post.isLiked = true;
        this.post.likes = (this.post.likes ?? 0) + 1;
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
    if (!this.post) return;

    const text = this.newComment.trim();
    if (!text) return;

    const tempId = 'temp-' + crypto.randomUUID();

    const temp: Comment = {
      id: tempId,
      postId: this.post.id,
      userId: this.currentUser?.id || 'me',
      username: this.currentUser?.username || 'you',
      avatarUrl: this.currentUser?.avatarUrl || 'svg/avatar.png',
      text,
      createdAt: new Date().toISOString(),
    };

    // ✅ optimistic UI
    this.comments = [temp, ...this.comments];
    this.post.comments = (this.post.comments ?? 0) + 1;
    this.newComment = '';
    this.cdr.detectChanges();

    this.posts.addComment(this.post.id, text).subscribe({
      next: (created) => {
        // ✅ replace temp with created (no duplication)
        this.comments = this.comments.map((c) => (c.id === tempId ? created : c));
        this.cdr.detectChanges();
      },
      error: (err) => {
        // rollback
        this.comments = this.comments.filter((c) => c.id !== tempId);
        this.post!.comments = Math.max(0, (this.post!.comments ?? 1) - 1);

        this.snack.error(err?.error?.message || 'Failed to add comment');
        this.cdr.detectChanges();
      },
    });
  }

  canDeleteComment(c: Comment): boolean {
    if (!this.currentUser || !this.post) return false;
    return (
      c.userId === this.currentUser.id || this.post.authorId === this.currentUser.id || this.isAdmin
    );
  }

 onDeleteComment(c: Comment) {
  if (!this.post) return;

  this.confirm('Delete comment', 'Do you really want to delete this comment?')
    .subscribe((ok) => {
      if (!ok || !this.post) return;

      this.posts.deleteComment(this.post.id, c.id).subscribe({
        next: () => {
          this.comments = this.comments.filter((x) => x.id !== c.id);
          this.post!.comments = Math.max(0, (this.post!.comments ?? 0) - 1);
          this.snack.success('Comment deleted');
        },
        error: (err) => {
          console.error('Delete comment failed', err);
          this.snack.error(err?.error?.message || 'Failed to delete comment');
        },
      });
    });
}


  // ✅ FIXED: avoid NG0100 by updating post on next tick + normalize media
  onEditPost() {
    if (!this.post) return;

    const dialogRef = this.dialog.open<EditPostDialogComponent, EditPostData, Post>(
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
      },
    );

    dialogRef.afterClosed().subscribe((updatedPost) => {
      if (!updatedPost || !this.post) return;

      // ✅ defer = prevents ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        this.post = {
          ...this.post!,
          ...updatedPost,
          media: updatedPost.media ?? [], // ✅ key when deleting all media
          coverMedia: updatedPost.coverMedia ?? undefined,
        };

        // optional: refresh comments count if backend returns it
        // this.post.comments = updatedPost.comments ?? this.post.comments;

        this.cdr.detectChanges();
      });
    });
  }

 onDeletePost() {
  if (!this.post) return;

  this.confirm(
    'Delete post',
    'Do you really want to delete your post?\n\nWarning: all comments and likes will be removed.'
  ).subscribe((ok) => {
    if (!ok || !this.post) return;

    this.posts.deletePost(this.post.id).subscribe({
      next: () => {
        this.snack.success('Post deleted');
        this.router.navigate(['/feed']);
      },
      error: (err) => {
        console.error('Delete failed', err);
        this.snack.error(err?.error?.message || 'Failed to delete post');
      },
    });
  });
}


  openReportDialog() {
    if (!this.post || !this.currentUser) {
      this.snack.error('You must be logged in to report a post.');
      return;
    }

    const reportRef = this.dialog.open<
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

    reportRef.afterClosed().subscribe((result) => {
      if (!result || !this.post) return;

      // ✅ confirm before sending report
      const confirmRef = this.dialog.open<
        ConfirmDialogComponent,
        { title: string; message: string },
        boolean
      >(ConfirmDialogComponent, {
        width: '420px',
        data: {
          title: 'Confirm report',
          message:
            `Are you sure you want to report this post?\n\n` +
            `Category: ${result.category}\n` +
            `Reason: ${result.reason}`,
        },
      });

      confirmRef.afterClosed().subscribe((confirmed) => {
        if (!confirmed || !this.post) return;

        this.reports
          .reportPost({
            reportedUserId: this.post.authorId,
            reportedPostId: this.post.id,
            category: result.category,
            reason: result.reason,
          })
          .subscribe({
            next: () => this.snack.success('Report submitted. Thank you.'),
            error: (err) => this.snack.error(err?.error?.message || 'Failed to submit report.'),
          });
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

  get canManagePost(): boolean {
    if (!this.post) return false;
    return !!this.currentUser && (this.currentUser.id === this.post.authorId || this.isAdmin);
  }

  onAdminDeletePost() {
  if (!this.post) return;

  this.confirm(
    'Delete post (Admin)',
    'Admin action:\n\nDelete this post?\nThis cannot be undone.'
  ).subscribe((ok) => {
    if (!ok || !this.post) return;

    this.admin.deletePost(this.post.id).subscribe({
      next: () => {
        this.snack.success('Post deleted');
        this.router.navigate(['/feed']);
      },
      error: (err) => {
        console.error('Admin delete failed', err);
        this.snack.error(err?.error?.message || 'Failed to delete post');
      },
    });
  });
}


  private confirm(title: string, message: string) {
    return this.dialog
      .open<ConfirmDialogComponent, { title: string; message: string }, boolean>(
        ConfirmDialogComponent,
        {
          width: '420px',
          maxWidth: '92vw',
          autoFocus: false,
          restoreFocus: true,
          data: { title, message },
        },
      )
      .afterClosed();
  }
}
