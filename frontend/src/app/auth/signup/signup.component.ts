import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DefaultLoginLayoutComponent } from '../components/default-login-layout/default-login-layout.component';
import { LoginService } from '../services/login.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SnackService } from '../../core/snack.service';
import { toUserMessage } from '../../core/http-error.util';
import { CommonModule } from '@angular/common';

interface SignupForm {
  name: FormControl<string | null>;
  username: FormControl<string | null>;
  email: FormControl<string | null>;
  password: FormControl<string | null>;
  passwordConfirm: FormControl<string | null>;
  age: FormControl<number | null>;
  bio: FormControl<string | null>;
  avatar: FormControl<File | null>;
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    DefaultLoginLayoutComponent,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    CommonModule,
  ],
  providers: [LoginService],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class SignUpComponent {
  hidePw = true;
  hidePw2 = true;
  avatarName: string | null = null;
  readonly MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB

  signupForm = new FormGroup<SignupForm>({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    username: new FormControl('', [Validators.required, Validators.minLength(3)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    passwordConfirm: new FormControl('', [Validators.required, Validators.minLength(6)]),
    age: new FormControl<number | null>(null, [Validators.required, Validators.min(15)]),
    bio: new FormControl<string | null>(null),
    avatar: new FormControl<File | null>(null),
  });

  constructor(
    private router: Router,
    private loginService: LoginService,
    private snack: SnackService
  ) {}

  // Getters for cleaner template binding
  get name() { return this.signupForm.get('name'); }
  get username() { return this.signupForm.get('username'); }
  get email() { return this.signupForm.get('email'); }
  get password() { return this.signupForm.get('password'); }
  get passwordConfirm() { return this.signupForm.get('passwordConfirm'); }
  get age() { return this.signupForm.get('age'); }
  get bio() { return this.signupForm.get('bio'); }
  get avatar() { return this.signupForm.get('avatar'); }

  // Handle avatar upload
  onAvatar(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    if (file && file.size > this.MAX_AVATAR_SIZE) {
      this.snack.error('Selected image is too large (max 2 MB).');
      this.avatar?.setValue(null);
      this.avatarName = null;
      return;
    }
    this.avatar?.setValue(file);
    this.avatarName = file?.name ?? null;
  }

  submit() {
    const v = this.signupForm.getRawValue();

    // Password match validation
    if (v.password !== v.passwordConfirm) {
      this.passwordConfirm?.setErrors({ mismatch: true });
      this.snack.error('Passwords do not match.');
      return;
    }

    // Extra age validation (UI-level)
    if ((v.age ?? 0) < 15) {
      this.age?.setErrors({ tooYoung: true });
      this.snack.error('You must be at least 15 years old.');
      return;
    }

    if (this.signupForm.invalid) {
      this.snack.error('Please correct the highlighted fields.');
      return;
    }

    // Call backend
    this.loginService.signupMultipart({
      name: v.name!,
      username: v.username!,
      email: v.email!,
      password: v.password!,
      age: v.age!,
      bio: v.bio ?? undefined,
      avatar: v.avatar ?? null
    }).subscribe({
      next: () => {
        this.snack.success('Account created. Please log in.');
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        const msg = toUserMessage(err, 'Could not create your account.');
        // Handle 409 conflict (username/email taken)
        if (err?.status === 409) {
          const detail = (err?.error?.message || '').toLowerCase();
          if (detail.includes('username')) this.username?.setErrors({ taken: true });
          if (detail.includes('email')) this.email?.setErrors({ taken: true });
        }
        this.snack.error(msg);
      }
    });
  }

  navigate() {
    this.router.navigate(['auth/login']);
  }
}
