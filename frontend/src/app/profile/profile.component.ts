import { Component, OnInit } from '@angular/core';
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
export class ProfileComponent implements OnInit {
  user: UserProfile | null = null;
  currentUserId: string | null = null;
  loading = true;
  error: string | null = null;
  selectedTab: 'my' | 'saved' | 'liked' = 'my';
  posts: Post[] = [];
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

ngOnInit(): void {
  this.userService.getCurrentUser().subscribe({
    next: (currentUser) => {
      this.currentUserId = currentUser?.id ?? null;
      this.loadProfileFromRoute();
    },
    error: () => {
      this.currentUserId = null;
      this.loadProfileFromRoute();
    }
  });
}


private loadProfileFromRoute() {
  const username = this.route.snapshot.paramMap.get('username');

  if (!username) {
    this.error = 'No username provided.';
    this.loading = false;
    return;
  }

  this.loadUser(username);
}


  loadUser(username: string) {
    this.loading = true;
    this.userService.getProfileByUsername(username).subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
        this.loadPostsForTab();
      },
      error: () => {
        this.error = 'User not found';
        this.loading = false;
      },
    });
  }
toggleFollow() {
  if (!this.user) return;

  // Prevent self-follow in the UI
  if (this.currentUserId && this.currentUserId === this.user.id) return;

  const wasSubscribed = !!this.user.isSubscribed;
  // optionally set loading state: this.user.isSubscribed = undefined;

  if (wasSubscribed) {
    this.userService.unsubscribe(this.user.id).subscribe({
      next: () => {
        this.loadUser(this.user!.username); // refresh server truth
        this.snackBar.open('Unfollowed successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Unfollow failed:', err);
        // reload profile to sync state
        this.reloadProfile();
        this.snackBar.open('Failed to unfollow', 'Close', { duration: 3000 });
      }
    });
  } else {
    this.userService.subscribe(this.user.id).subscribe({
      next: () => {
        this.loadUser(this.user!.username);
        this.snackBar.open('Followed successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Follow failed:', err);
        // If server says "Already following" (400) or other mismatch, reload profile to sync
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
  this.userService.getProfileByUsername(this.user.username).subscribe({
    next: (u) => this.user = u,
    error: (e) => console.error('Failed to reload profile', e)
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
    if (!this.user) return;
    this.loadingPosts = true;

    let obs;
    if (this.selectedTab === 'my') {
      obs = this.postService.getUserPosts(this.user.id);
    } else if (this.selectedTab === 'liked') {
      obs = this.postService.getLikedPosts(this.user.id);
    } else {
      obs = this.postService.getSavedPosts(this.user.id);
    }

    obs.subscribe({
      next: (posts) => {
        this.posts = posts;
        this.loadingPosts = false;
      },
      error: () => {
        this.posts = [];
        this.loadingPosts = false;
      },
    });
  }
  editProfile() {
    if (!this.user) return;
    const dialogRef = this.dialog.open(EditProfileDialogComponent, {
      width: '400px',
      data: { ...this.user },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;

      const { changes, avatar } = result;

      if (Object.keys(changes).length === 0 && !avatar) {
        this.snackBar.open('Nothing to update', 'Close', { duration: 3000 });
        return;
      }

      if (avatar) {
        // Upload avatar file first
        const formData = new FormData();
        formData.append('avatar', avatar);

        this.userService.uploadAvatar(formData).subscribe({
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
    this.userService.updateProfile(changes).subscribe({
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
