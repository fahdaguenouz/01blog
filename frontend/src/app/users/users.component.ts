import { Component, OnInit } from '@angular/core';
import { FormControl,ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged, switchMap, startWith } from 'rxjs';
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
    CommonModule, RouterLink, 
    MatFormFieldModule, MatInputModule, MatCardModule, 
    MatButtonModule, ReactiveFormsModule, MatProgressSpinnerModule, MatIconModule, MatGridListModule
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  searchControl = new FormControl('', { nonNullable: true });
  users: UserProfile[] = [];
  loading = false;
  noResults = false;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        this.loading = true;
        this.noResults = false;
        if (!query?.trim()) {
          this.users = [];
          this.loading = false;
          return [];
        }
        return this.userService.searchUsers(query);
      })
    ).subscribe({
      next: (results) => {
        this.users = results;
        this.noResults = results.length === 0;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.users = [];
        this.noResults = true;
      }
    });
  }

  clearSearch() {
    this.searchControl.setValue('');
  }
}
