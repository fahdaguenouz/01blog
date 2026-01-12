// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { Home } from './home/home.component';
import { FeedComponent } from './feed/feed.component';
import { AuthGuard } from './auth/services/auth-guard.service';
import { GuestGuard } from './auth/services/guest-guard.service';
import { SignUpComponent } from './auth/signup/signup.component';
import { PostDetailComponent } from './post/post-detail/post-detail.component';
import { CreatePostComponent } from './post/create-post/create-post.component';
import { ProfileComponent } from './profile/profile.component';
import { AdminGuard } from './auth/services/admin.guard';
import { AdminDashboardComponent } from './admin/dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './admin/users/admin-users.component';
import { AdminReportsComponent } from './admin/reports/admin-reports.component';
import { UsersComponent } from './users/users.component';

export const routes: Routes = [
  { path: '', component: Home, canActivate: [GuestGuard] }, // root -> feed
  { path: 'feed', component: FeedComponent, canActivate: [AuthGuard] },
  { path: 'users', component: UsersComponent, canActivate: [AuthGuard] },
  { path: 'post/create', component: CreatePostComponent, canActivate: [AuthGuard] },
  { path: 'post/:id', component: PostDetailComponent, canActivate: [AuthGuard] },
  { path: 'profile/:username', component: ProfileComponent, canActivate: [AuthGuard] },
  {
    path: 'admin',
    canActivate: [AuthGuard, AdminGuard],
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'reports', component: AdminReportsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: 'auth/login', component: LoginComponent, canActivate: [GuestGuard] },
  { path: 'auth/signup', component: SignUpComponent, canActivate: [GuestGuard] },
  { path: '**', redirectTo: '' },
];
