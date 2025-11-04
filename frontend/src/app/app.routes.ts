import { Routes } from '@angular/router';
import {  LoginComponent } from './auth/login/login.component';
import { Home } from './home/home.component';
import { SignUpComponent } from './auth/signup/signup.component';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/signup', component: SignUpComponent },
  { path: '**', redirectTo: '' }
];
