import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  startWith,
  map,
  catchError,
  of,
  tap,
} from 'rxjs';
import { RouterLink } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { UserProfile, UserService } from '../services/user.service';
import { MatGridListModule } from '@angular/material/grid-list';

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
export class UsersComponent implements OnInit {
  searchControl = new FormControl('', { nonNullable: true });
  users: UserProfile[] = [];
  loading = false;
  noResults = false;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.searchControl.valueChanges
      .pipe(
        startWith(this.searchControl.value),
        map((v) => (v || '').trim()),
        debounceTime(300),
        distinctUntilChanged(),

        tap(() => {
          this.loading = true;
          this.noResults = false;
        }),

        switchMap((query) => {
          if (!query) {
            this.loading = false;
            this.users = [];
            this.noResults = false;
            return of<UserProfile[]>([]);
          }

          return this.userService.searchUsers(query).pipe(catchError(() => of<UserProfile[]>([])));
        })
      )
      .subscribe((results) => {
        this.users = results.map((u) => ({
          ...u,
          avatarUrl:u.avatarUrl,
        }));
        console.log('Search results:', this.users);

        this.loading = false;
        this.noResults = !this.users.length && !!this.searchControl.value.trim();
      });
  }

  clearSearch() {
    this.searchControl.setValue('');
  }


  getAvatar(user: UserProfile): string {
    return user.avatarUrl?.trim() ? user.avatarUrl : 'svg/avatar.png';
  }

  onImgError(ev: Event) {
    const img = ev.target as HTMLImageElement;
    img.src = 'svg/avatar.png';
  }
}
