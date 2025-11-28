import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService, UserProfile } from '../services/user.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EditProfileDialogComponent } from './edit-profile.component';
import { Post, PostService } from '../services/post.service';
import { AuthService } from '../services/auth.service';
import { Subject, of } from 'rxjs';
import { switchMap, distinctUntilChanged, takeUntil, catchError, tap } from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  user: UserProfile | null = null;
  currentUserId: string | null = null;
  loading = true;
  error: string | null = null;
  selectedTab: 'my' | 'saved' | 'liked' = 'my';
  posts: Post[] = [];
  loadingPosts = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private postService: PostService,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    // fetch current user once (if you need currentUserId for follow button)
    this.userService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: u => this.currentUserId = u?.id ?? null,
        error: () => this.currentUserId = null
      });

    // react to username param changes reliably and switch to the latest profile request
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        // map to username string
        // use distinctUntilChanged to avoid duplicating identical username loads
        switchMap(paramMap => {
          const username = paramMap.get('username');
          if (!username) {
            this.error = 'No username provided.';
            this.loading = false;
            return of(null);
          }
          this.error = null;
          this.loading = true;
          // call service that returns Observable<UserProfile>
          return this.userService.getProfileByUsername(username)
            .pipe(
              catchError(err => {
                console.error('getProfileByUsername error', err);
                // set a user-friendly error and return null so flow continues
                this.error = (err?.status === 404) ? 'User not found' : 'Failed to load profile';
                this.loading = false;
                return of(null);
              })
            );
        })
      )
      .subscribe((u: UserProfile | null) => {
        // if null we already set loading/error in catchError branch
        if (!u) {
          // clear user and posts
          this.user = null;
          this.posts = [];
          this.loading = false;
          return;
        }
        // success
        this.user = u;
        this.loading = false;
        // load posts for the currently selected tab
        this.loadPostsForTab();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUser(username: string) {
    // kept for backward compatibility, but prefer route param driven flow
    this.loading = true;
    this.userService.getProfileByUsername(username).pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        console.error('loadUser error', err);
        this.error = 'User not found';
        this.loading = false;
        return of(null);
      })
    ).subscribe(u => {
      if (!u) {
        this.user = null;
        this.posts = [];
        return;
      }
      this.user = u;
      this.loading = false;
      this.loadPostsForTab();
    });
  }

  toggleFollow() {
    if (!this.user) return;
    if (this.currentUserId && this.currentUserId === this.user.id) return;

    const wasSubscribed = !!this.user.isSubscribed;

    if (wasSubscribed) {
      this.userService.unsubscribe(this.user.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.reloadProfile();
          this.snackBar.open('Unfollowed successfully', 'Close', { duration: 3000 });
        },
        error: (err) => {
          console.error('Unfollow failed:', err);
          this.reloadProfile();
          this.snackBar.open('Failed to unfollow', 'Close', { duration: 3000 });
        }
      });
    } else {
      this.userService.subscribe(this.user.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.reloadProfile();
          this.snackBar.open('Followed successfully', 'Close', { duration: 3000 });
        },
        error: (err) => {
          console.error('Follow failed:', err);
          if (err?.status === 400 || err?.status === 409) {
            this.reloadProfile();
          }
          this.snackBar.open('Failed to follow', 'Close', { duration: 3000 });
        }
      });
    }
  }

  private reloadProfile() {
    if (!this.user) return;
    // show a small loading for UX
    this.loading = true;
    this.userService.getProfileByUsername(this.user.username).pipe(
      takeUntil(this.destroy$),
      catchError(e => {
        console.error('Failed to reload profile', e);
        this.loading = false;
        return of(null);
      })
    ).subscribe(u => {
      if (u) this.user = u;
      this.loading = false;
    });
  }

  goToPostDetail(post: Post) {
    this.router.navigate(['/post', post.id]);
  }

  onTabChange(tab: 'my' | 'saved' | 'liked') {
    if (this.selectedTab === tab) return;
    this.selectedTab = tab;
    this.loadPostsForTab();
  }

  private loadPostsForTab() {
    if (!this.user) {
      this.posts = [];
      return;
    }
    this.loadingPosts = true;

    let obs;
    if (this.selectedTab === 'my') {
      obs = this.postService.getUserPosts(this.user.id);
    } else if (this.selectedTab === 'liked') {
      obs = this.postService.getLikedPosts(this.user.id);
    } else {
      obs = this.postService.getSavedPosts(this.user.id);
    }

    obs.pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        console.error('Loading posts failed', err);
        this.posts = [];
        this.loadingPosts = false;
        return of([]);
      })
    ).subscribe(posts => {
      this.posts = posts ?? [];
      this.loadingPosts = false;
    });
  }

  editProfile() {
    if (!this.user) return;
    const dialogRef = this.dialog.open(EditProfileDialogComponent, {
      width: '400px',
      data: { ...this.user },
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (!result) return;

      const { changes, avatar } = result;

      if (Object.keys(changes).length === 0 && !avatar) {
        this.snackBar.open('Nothing to update', 'Close', { duration: 3000 });
        return;
      }

      if (avatar) {
        const formData = new FormData();
        formData.append('avatar', avatar);

        this.userService.uploadAvatar(formData).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => this.updateProfile(changes),
          error: () => {
            this.snackBar.open('Failed to upload avatar', 'Close', { duration: 3000 });
          },
        });
      } else {
        this.updateProfile(changes);
      }
    });
  }

  private updateProfile(changes: Partial<UserProfile>) {
    this.userService.updateProfile(changes).pipe(takeUntil(this.destroy$)).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Failed to update profile', 'Close', { duration: 3000 });
      },
    });
  }
}
