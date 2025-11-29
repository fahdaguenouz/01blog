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
import { BehaviorSubject, combineLatest } from 'rxjs';
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
  followers: UserProfile[] = [];
  following: UserProfile[] = [];
  showFollowers = false;
  showFollowing = false;
  loadingFollowers = false;
  loadingFollowing = false;
private selectedTab$ = new BehaviorSubject<'my' | 'saved' | 'liked'>('my');
private profileUser$ = new BehaviorSubject<UserProfile | null>(null);
  loadingMyPosts = false;
  loadingLikedPosts = false;
  loadingSavedPosts = false;
  private destroy$ = new Subject<void>();
loadingPosts = false;
  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private postService: PostService,
    private router: Router,
    private auth: AuthService
  ) {}

ngOnInit() {
  // Load profile via route
  this.route.paramMap.pipe(
    takeUntil(this.destroy$),
    switchMap(params => {
      const username = params.get('username');
      if (!username) return of(null);
      this.loading = true;
      return this.userService.getProfileByUsername(username).pipe(
        catchError(err => {
          this.error = err?.status === 404 ? 'User not found' : 'Failed to load profile';
          this.loading = false;
          return of(null);
        })
      );
    })
  ).subscribe(profile => {
    this.loading = false;
    this.user = profile ? this.normalizeProfile(profile) : null;
    this.profileUser$.next(this.user);
  });

  // React to profile + tab changes for posts
  combineLatest([this.profileUser$, this.selectedTab$])
    .pipe(
      takeUntil(this.destroy$),
      switchMap(([user, tab]) => {
        if (!user) return of([]);
        this.loadingPosts = true;
        let obs;
        if (tab === 'my') obs = this.postService.getUserPosts(user.id);
        else if (tab === 'liked') obs = this.postService.getLikedPosts(user.id);
        else obs = this.postService.getSavedPosts(user.id);

        return obs.pipe(
          catchError(err => {
            console.error(`❌ ${tab} posts ERROR:`, err);
            return of([]);
          }),
          tap(() => this.loadingPosts = false)
        );
      })
    )
    .subscribe(posts => {
      this.posts = posts ?? [];
      this.loadingPosts = false;
    });
}


ngOnDestroy(): void {

  this.destroy$.next();
  this.destroy$.complete();
}


  loadUser(username: string) {
    // kept for backward compatibility, but prefer route param driven flow
    this.loading = true;
    this.userService
      .getProfileByUsername(username)
      .pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          console.error('loadUser error', err);
          this.error = 'User not found';
          this.loading = false;
          return of(null);
        })
      )
      .subscribe((u) => {
        if (!u) {
          this.user = null;
          this.posts = [];
          return;
        }
        this.user = this.normalizeProfile(u);

        this.loading = false;
        this.loadPostsForTab();
      });
  }

  /** Normalize server DTO into our frontend UserProfile shape */
  private normalizeProfile(dto: any): UserProfile {
    if (!dto) return dto;

    const normalized: any = { ...dto };

    // server might return `subscribed` instead of `isSubscribed`
    if (normalized.isSubscribed === undefined) {
      normalized.isSubscribed = normalized.subscribed ?? false;
    }

    // counts normalization (backend might use different names)
    if (normalized.subscribersCount === undefined) {
      normalized.subscribersCount = normalized.followersCount ?? normalized.subscribedCount ?? 0;
    }
    if (normalized.subscriptionsCount === undefined) {
      normalized.subscriptionsCount =
        normalized.followingCount ?? normalized.subscriptionCount ?? 0;
    }

    // ensure numbers exist
    normalized.subscribersCount = normalized.subscribersCount ?? 0;
    normalized.subscriptionsCount = normalized.subscriptionsCount ?? 0;

    return normalized as UserProfile;
  }

  toggleFollow() {
    if (!this.user) {
      return;
    }

    if (this.currentUserId === this.user.id) {
      return;
    }

    const targetUserId = this.user.id;
    const currentlySubscribed = !!this.user.isSubscribed;

    // optimistic UI: quick feedback
    this.user.isSubscribed = !currentlySubscribed;
    this.user.subscribersCount = (this.user.subscribersCount || 0) + (currentlySubscribed ? -1 : 1);

    const req$ = currentlySubscribed
      ? this.userService.unsubscribe(targetUserId)
      : this.userService.subscribe(targetUserId);

    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (updatedProfile) => {
        if (updatedProfile) {
          // use normalized server DTO as authoritative
          this.user = this.normalizeProfile(updatedProfile);
        } else {
          // fallback: reload profile from server (already uses withCredentials)
          this.reloadProfile();
        }

        const msg = currentlySubscribed ? 'Unfollowed' : 'Followed';
        this.snackBar.open(`${msg} successfully`, 'Close', { duration: 2500 });
      },
      error: (err) => {
        // revert optimistic UI
        this.user!.isSubscribed = currentlySubscribed;
        this.user!.subscribersCount =
          (this.user!.subscribersCount || 0) + (currentlySubscribed ? 0 : -1);

        this.snackBar.open('Action failed', 'Close', { duration: 3000 });
      },
    });
  }

  private reloadProfile() {
    if (!this.user) {
      return;
    }

    this.userService
      .getProfileByUsername(this.user.username)
      .pipe(
        takeUntil(this.destroy$),
        catchError((e) => {
          return of(null);
        })
      )
      .subscribe((u) => {
        if (u) {
          const normalized = this.normalizeProfile(u);
          this.user = normalized;
        } else {
          console.log('[reloadProfile] No data returned from server');
        }
      });
  }

  goToPostDetail(post: Post) {
    this.router.navigate(['/post', post.id]);
  }

 onTabChange(tab: 'my' | 'saved' | 'liked') {
  this.selectedTab$.next(tab);
}


private loadPostsForTab() {
  if (!this.user) {
    this.posts = [];
    this.loadingPosts = false;
    return;
  }

  console.log(`🚀 Loading ${this.selectedTab} posts for: ${this.user.id}`);
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
    tap(posts => console.log(`✅ Backend responded ${this.selectedTab}:`, posts.length, 'posts')),
    catchError(err => {
      console.error(`❌ ${this.selectedTab} posts ERROR:`, err);
      this.posts = [];
      this.loadingPosts = false;
      return of([]);
    })
  ).subscribe(posts => {
    console.log(`🎉 ${this.selectedTab} posts RENDERED:`, posts.length);
    this.posts = posts ?? [];
    this.loadingPosts = false;  // ← This MUST fire now
  });
}


  editProfile() {
    if (!this.user) return;
    const dialogRef = this.dialog.open(EditProfileDialogComponent, {
      width: '400px',
      data: { ...this.user },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (!result) return;

        const { changes, avatar } = result;

        if (Object.keys(changes).length === 0 && !avatar) {
          this.snackBar.open('Nothing to update', 'Close', { duration: 3000 });
          return;
        }

        if (avatar) {
          const formData = new FormData();
          formData.append('avatar', avatar);

          this.userService
            .uploadAvatar(formData)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
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
    this.userService
      .updateProfile(changes)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedUser) => {
          this.user = updatedUser;
          this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Failed to update profile', 'Close', { duration: 3000 });
        },
      });
  }
  showFollowersList() {
    if (!this.user) return;
    console.log('[showFollowersList] Loading followers for:', this.user.id);
    this.loadingFollowers = true;
    this.showFollowers = true;
    this.showFollowing = false;

    this.userService
      .getFollowers(this.user.id)
      .pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          console.error('Failed to load followers', err);
          this.snackBar.open('Failed to load followers', 'Close');
          this.loadingFollowers = false;
          return of([]);
        })
      )
      .subscribe((followers) => {
        this.followers = followers ?? [];
        this.loadingFollowers = false;
        console.log('[showFollowersList] Loaded', this.followers.length, 'followers');
      });
  }

  showFollowingList() {
    if (!this.user) return;
    console.log('[showFollowingList] Loading following for:', this.user.id);
    this.loadingFollowing = true;
    this.showFollowing = true;
    this.showFollowers = false;

    this.userService
      .getFollowing(this.user.id)
      .pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          console.error('Failed to load following', err);
          this.snackBar.open('Failed to load following', 'Close');
          this.loadingFollowing = false;
          return of([]);
        })
      )
      .subscribe((following) => {
        this.following = following ?? [];
        this.loadingFollowing = false;
        console.log('[showFollowingList] Loaded', this.following.length, 'following');
      });
  }

  goToUserProfile(username: string) {
    console.log('[goToUserProfile] Navigating to user:', username);
    this.router.navigate(['/profile', username]);
    // Close modals
    this.showFollowers = false;
    this.showFollowing = false;
  }

  closeList() {
    this.showFollowers = false;
    this.showFollowing = false;
  }
}
