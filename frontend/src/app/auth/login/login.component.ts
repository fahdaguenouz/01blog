// src/app/auth/login/login.component.ts
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DefaultLoginLayoutComponent } from '../components/default-login-layout/default-login-layout.component';
import { LoginService } from '../../services/login.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SnackService } from '../../core/snack.service';
import { toUserMessage } from '../../core/http-error.util';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

interface LoginForm {
  username: FormControl<string | null>,
  password: FormControl<string | null>
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    DefaultLoginLayoutComponent,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  hidePw = true;

  loginForm = new FormGroup({
    username: new FormControl('', Validators.required),
    password: new FormControl('', [Validators.required, Validators.minLength(6)])
  });

  constructor(
    private router: Router,
    private loginService: LoginService,
    private snack: SnackService,
    private auth: AuthService
  ) {}

  get username() {
    return this.loginForm.get('username');
  }

  get password() {
    return this.loginForm.get('password');
  }

submit() {
  if (this.loginForm.invalid) {
    this.loginForm.markAllAsTouched();
    this.snack.error('Please enter your username and password.');
    return;
  }

  const { username, password } = this.loginForm.getRawValue();
  if (!username?.trim() || !password?.trim() || password.trim().length < 6|| username.trim().length < 2) {
    this.snack.error('Please enter your username and password.');
    return;
  }
  this.loginService.login(username!, password!).subscribe({
    next: async (res) => {
      // IMPORTANT: wait until /me is loaded and status becomes authenticated
      const me = await this.auth.setAuth({ token: res.token });

      if (!me) {
        this.snack.error('Login succeeded but session could not be loaded. Please try again.');
        return;
      }

      this.router.navigate([me.role === 'ADMIN' ? '/admin/dashboard' : '/feed']);
    },
    error: (err) => {
      this.snack.error(toUserMessage(err, 'Could not log you in.'));
    }
  });
}


  navigate() {
    this.router.navigate(['auth/signup']);
  }
}
