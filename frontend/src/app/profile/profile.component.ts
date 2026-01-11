import { ChangeDetectorRef, Component, OnDestroy, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
import { Observable, of, Subject, BehaviorSubject, combineLatest } from 'rxjs';
import {
  switchMap,
  distinctUntilChanged,
  takeUntil,
  catchError,
  finalize,
} from 'rxjs/operators';

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

  private destroy$ = new Subject<void>();
  loadingPosts = false;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private postService: PostService,
    private router: Router,
    private cd: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    // default tab
    this.selectedTab = 'my';
    this.selectedTab$.next('my');
    
    this.userService.getCurrentUser()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (me) => {
        this.currentUserId = me?.id || null;
      },
      error: () => {
        this.currentUserId = null;
      }
    });
    // Load profile via route
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          const username = params.get('username');
          if (!username) {
            this.loading = false;
            this.user = null;
            this.profileUser$.next(null);
            return of(null);
          }
          this.loading = true;
          return this.userService.getProfileByUsername(username).pipe(
            catchError((err) => {
              this.error = err?.status === 404 ? 'User not found' : 'Failed to load profile';
              return of(null);
            }),
            finalize(() => {
              this.loading = false;
            })
          );
        })
      )
      .subscribe((profile) => {
        this.user = profile ? this.normalizeProfile(profile) : null;
        this.profileUser$.next(this.user);
      });

    // Reactive posts loader
    combineLatest([this.profileUser$, this.selectedTab$.pipe(distinctUntilChanged())])
      .pipe(
        takeUntil(this.destroy$),
        switchMap(([user, tab]) => {
          if (!user) {
            this.posts = [];
            this.loadingPosts = false;
            return of([]);
          }

          this.selectedTab = tab;
          this.loadingPosts = true;

          // SSR-safe fallback timer
          const fallbackMs = 3000;
          let fallbackTimer: any = undefined;
          if (isPlatformBrowser(this.platformId)) {
            fallbackTimer = window.setTimeout(() => {
              if (this.loadingPosts) {
                console.warn('[posts.loader] fallback cleared loader after', fallbackMs, 'ms');
                this.loadingPosts = false;
                try {
                  this.cd.detectChanges();
                } catch (e) {
                  this.cd.markForCheck();
                }
              }
            }, fallbackMs);
          }

          let obs: Observable<Post[]>;
          if (tab === 'my') obs = this.postService.getUserPosts(user.id);
          else if (tab === 'liked') obs = this.postService.getLikedPosts(user.id);
          else obs = this.postService.getSavedPosts(user.id);

          return obs.pipe(
            catchError((err) => {
              console.error(`[posts.loader] ${tab} posts ERROR:`, err);
              return of([]);
            }),
            finalize(() => {
              if (fallbackTimer) {
                clearTimeout(fallbackTimer);
              }
              this.loadingPosts = false;
              try {
                this.cd.detectChanges();
              } catch (e) {
                this.cd.markForCheck();
              }
            })
          );
        })
      )
      .subscribe((posts) => {
        this.posts = posts ?? [];
        // console.log("posts in the profile ,", this.posts);
        
        try {
          this.cd.detectChanges();
        } catch (e) {
          this.cd.markForCheck();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUser(username: string) {
    this.loading = true;
    this.userService
      .getProfileByUsername(username)
      .pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          console.error('loadUser error', err);
          this.error = 'User not found';
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((u) => {
        if (!u) {
          this.user = null;
          this.posts = [];
          this.profileUser$.next(null);
          return;
        }
        this.user = this.normalizeProfile(u);
        this.profileUser$.next(this.user);
      });
  }

  private normalizeProfile(dto: any): UserProfile {
    if (!dto) return dto;

    const normalized: any = { ...dto };

    if (normalized.isSubscribed === undefined) {
      normalized.isSubscribed = normalized.subscribed ?? false;
    }

    if (normalized.subscribersCount === undefined) {
      normalized.subscribersCount = normalized.followersCount ?? normalized.subscribedCount ?? 0;
    }
    if (normalized.subscriptionsCount === undefined) {
      normalized.subscriptionsCount =
        normalized.followingCount ?? normalized.subscriptionCount ?? 0;
    }

    normalized.subscribersCount = normalized.subscribersCount ?? 0;
    normalized.subscriptionsCount = normalized.subscriptionsCount ?? 0;

    return normalized as UserProfile;
  }

  toggleFollow() {
    if (!this.user) return;
    if (this.currentUserId === this.user.id) return;

    const targetUserId = this.user.id;
    const currentlySubscribed = !!this.user.isSubscribed;

    this.user.isSubscribed = !currentlySubscribed;
    this.user.subscribersCount = (this.user.subscribersCount || 0) + (currentlySubscribed ? -1 : 1);

    const req$ = currentlySubscribed
      ? this.userService.unsubscribe(targetUserId)
      : this.userService.subscribe(targetUserId);

    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (updatedProfile) => {
        if (updatedProfile) {
          this.user = this.normalizeProfile(updatedProfile);
        } else {
          this.reloadProfile();
        }
        const msg = currentlySubscribed ? 'Unfollowed' : 'Followed';
        this.snackBar.open(`${msg} successfully`, 'Close', { duration: 2500 });
      },
      error: (err) => {
        this.user!.isSubscribed = currentlySubscribed;
        this.user!.subscribersCount =
          (this.user!.subscribersCount || 0) + (currentlySubscribed ? 0 : -1);

        this.snackBar.open('Action failed', 'Close', { duration: 3000 });
      },
    });
  }

  private reloadProfile() {
    if (!this.user) return;

    this.userService
      .getProfileByUsername(this.user.username)
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => of(null))
      )
      .subscribe((u) => {
        if (u) this.user = this.normalizeProfile(u);
        else console.log('[reloadProfile] No data returned from server');
      });
  }

  goToPostDetail(post: Post) {
    this.router.navigate(['/post', post.id]);
  }

  onTabChange(tab: 'my' | 'saved' | 'liked') {
    this.selectedTab = tab;
    this.selectedTab$.next(tab);
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
      });
  }

  showFollowingList() {
    if (!this.user) return;
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
      });
  }

  goToUserProfile(username: string) {
    this.router.navigate(['/profile', username]);
    this.showFollowers = false;
    this.showFollowing = false;
  }

  closeList() {
    this.showFollowers = false;
    this.showFollowing = false;
  }
  
  formatDate(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();

  // Normalize to midnight (important!)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const postDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const diffDays =
    (today.getTime() - postDay.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
}
