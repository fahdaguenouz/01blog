// src/app/users/users.component.ts
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';

import { UserProfile, UserService } from '../services/user.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatGridListModule,
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent {
  searchControl = new FormControl('', { nonNullable: true });

  users: UserProfile[] = [];
  loading = false;
  noResults = false;
  submittedQuery = '';

   constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

 onSearch(ev?: Event) {
    ev?.preventDefault();
    ev?.stopPropagation();

    const q = (this.searchControl.value ?? '').trim();
    if (!q) {
      this.clearSearch();
      this.cdr.detectChanges(); // ✅ force UI update immediately
      return;
    }

    this.submittedQuery = q;
    this.loading = true;
    this.noResults = false;
    this.cdr.detectChanges(); // ✅ show loading immediately

    this.userService.searchUsers(q).subscribe({
      next: (results) => {
        this.users = results ?? [];
        this.noResults = this.users.length === 0;
        this.loading = false;

        this.cdr.detectChanges(); // ✅ force UI render
      },
      error: () => {
        this.users = [];
        this.noResults = true;
        this.loading = false;

        this.cdr.detectChanges(); // ✅ force UI render
      },
    });
  }

  clearSearch() {
    this.searchControl.setValue('');
    this.submittedQuery = '';
    this.users = [];
    this.noResults = false;
    this.loading = false;
  }

  getAvatar(user: UserProfile): string {
    return user?.avatarUrl?.trim() ? user.avatarUrl : 'svg/avatar.png';
  }

  onImgError(ev: Event) {
    (ev.target as HTMLImageElement).src = 'svg/avatar.png';
  }
}
