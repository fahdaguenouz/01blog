// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { Home } from './home/home.component';
import { FeedComponent } from './feed/feed.component';
import { AuthGuard } from './auth/services/auth-guard.service';
import { GuestGuard } from './auth/services/guest-guard.service';
import { SignUpComponent } from './auth/signup/signup.component';
import { PostDetailComponent } from './post/post-detail.component';

export const routes: Routes = [
  { path: '', component: Home, canActivate: [GuestGuard] },
  { path: 'feed', component: FeedComponent, canActivate: [AuthGuard] },
  { path: 'post/:id', component: PostDetailComponent, canActivate: [AuthGuard] },
  { path: 'auth/login', component: LoginComponent, canActivate: [GuestGuard] },
  { path: 'auth/signup', component: SignUpComponent, canActivate: [GuestGuard] },
  { path: '**', redirectTo: '' }
];
