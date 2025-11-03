import { Routes } from '@angular/router';
import { Login } from './auth/login/login.component';
import { Home } from './home/home.component';
import { RegisterComponent } from './auth/register/register.component';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'auth/login', component: Login },
  { path: 'auth/register', component: RegisterComponent },
  { path: '**', redirectTo: '' }
];
