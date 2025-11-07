import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DefaultLoginLayoutComponent } from '../components/default-login-layout/default-login-layout.component';
import { PrimaryInputComponent } from '../components/primary-input/primary-input.component';
import { LoginService } from '../services/login.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SnackService } from '../../core/snack.service';
import { toUserMessage } from '../../core/http-error.util';

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
    PrimaryInputComponent,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  providers: [LoginService],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class SignUpComponent {
  hidePw = true;
  hidePw2 = true;

  signupForm = new FormGroup<SignupForm>({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    username: new FormControl('', [Validators.required, Validators.minLength(3)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    passwordConfirm: new FormControl('', [Validators.required, Validators.minLength(6)]),
    age: new FormControl<number | null>(null, [Validators.required, Validators.min(15)]),
    bio: new FormControl<string | null>(null),          // optional
    avatar: new FormControl<File | null>(null)          // optional
  });

  avatarName: string | null = null;

  constructor(private router: Router, private loginService: LoginService, private snack: SnackService) {}

  onAvatar(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0] || null;
    this.signupForm.get('avatar')?.setValue(f);
    this.avatarName = f ? f.name : null;
  }

  submit() {
    const v = this.signupForm.value;

    if (v.password !== v.passwordConfirm) {
      this.signupForm.get('passwordConfirm')?.setErrors({ mismatch: true });
      this.snack.error('Passwords do not match.');
      return;
    }
    // UI enforcement of 15+ beyond Validators.min(15)
    if ((v.age ?? 0) < 15) {
      this.signupForm.get('age')?.setErrors({ tooYoung: true });
      this.snack.error('You must be at least 15 years old.');
      return;
    }

    if (this.signupForm.invalid) {
      this.snack.error('Please correct the highlighted fields.');
      return;
    }

    this.loginService.signupMultipart({
      name: v.name!, username: v.username!, email: v.email!, password: v.password!, age: v.age!,
      bio: v.bio ?? undefined, avatar: v.avatar ?? null
    }).subscribe({
      next: () => {
        this.snack.success('Account created. Please log in.');
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        const msg = toUserMessage(err, 'Could not create your account.');
        if (err?.status === 409) {
          const detail = (err?.error?.message || '').toLowerCase();
          if (detail.includes('username')) this.signupForm.get('username')?.setErrors({ taken: true });
          if (detail.includes('email')) this.signupForm.get('email')?.setErrors({ taken: true });
        }
        this.snack.error(msg);
      }
    });
  }

  navigate() { this.router.navigate(['auth/login']); }
}
