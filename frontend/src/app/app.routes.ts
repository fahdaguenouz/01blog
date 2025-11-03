import { Routes } from '@angular/router';
import {  LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { Home } from './home/home.component';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent },
  { path: '**', redirectTo: '' }
];
