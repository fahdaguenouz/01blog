import { Routes } from '@angular/router';
import { Login } from './auth/login/login.component';
import { Home } from './home/home.component';


    export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login }
];
