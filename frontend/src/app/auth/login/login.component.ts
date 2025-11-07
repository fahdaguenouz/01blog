// src/app/auth/login/login.component.ts
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DefaultLoginLayoutComponent } from '../components/default-login-layout/default-login-layout.component';
import { PrimaryInputComponent } from '../components/primary-input/primary-input.component';
import { LoginService } from '../services/login.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SnackService } from '../../core/snack.service';
import { toUserMessage } from '../../core/http-error.util';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

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
    PrimaryInputComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule 
  ],
  providers: [LoginService],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  hidePw = true;
  loginForm = new FormGroup<LoginForm>({
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)])
  });

  constructor(
    private router: Router,
    private loginService: LoginService,
    private snack: SnackService
  ) {}

  submit() {
    if (this.loginForm.invalid) {
      this.snack.error('Please enter your username and password.');
      return;
    }
    const v = this.loginForm.value;
    this.loginService.login(v.username!, v.password!).subscribe({
      next: () => {
        this.snack.success('Logged in successfully.');
        this.router.navigate(['/feed']);
      },
      error: (err) => {
        const msg = toUserMessage(err, 'Could not log you in.');
        this.snack.error(msg);
      }
    });
  }

  navigate() { this.router.navigate(['auth/signup']); }
}
