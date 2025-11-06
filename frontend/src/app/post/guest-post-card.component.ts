// src/app/public-posts/guest-post-card.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { PublicPostSummary } from './public-posts.service';

@Component({
  selector: 'app-guest-post-card',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card class="example-card" appearance="outlined" (click)="goLogin()" role="button">
      <mat-card-header>
        <div mat-card-avatar class="example-header-image"></div>
        <mat-card-title>{{ post.title }}</mat-card-title>
        <mat-card-subtitle>
          {{ post.authorName || post.authorUsername }} • {{ post.createdAt | date:'medium' }}
        </mat-card-subtitle>
      </mat-card-header>

      <img *ngIf="imageUrl" mat-card-image [src]="imageUrl" alt="Post cover">
      <mat-card-content>
        <p>{{ post.excerpt }}</p>
      </mat-card-content>

      <mat-card-actions>
        <button mat-button>LIKE ({{ post.likes }})</button>
        <button mat-button>SHARE</button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .example-card { margin-bottom: 16px; cursor: pointer; }
    .example-header-image { background-image: url('/assets/avatar-placeholder.png'); background-size: cover; }
  `]
})
export class GuestPostCardComponent {
  @Input() post!: PublicPostSummary;
  // If you later add a cover image URL to the API, bind here
  imageUrl: string | null = null;

  constructor(private router: Router) {}
  goLogin() { this.router.navigateByUrl('/auth/login'); }
}
