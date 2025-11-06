import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { PublicPostSummary } from './public-posts.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-guest-post-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <mat-card class="guest-post-card" appearance="outlined" (click)="goLogin()">
      <mat-card-header>
        <div mat-card-avatar class="avatar"></div>
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
        <button mat-button disabled>
          <mat-icon>favorite_border</mat-icon> {{ post.likes }}
        </button>
        <button mat-button disabled>
          <mat-icon>comment</mat-icon> {{ post.comments }}
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .guest-post-card {
      margin-bottom: 20px;
      border-radius: 12px;
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: pointer;
    }
    .guest-post-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .avatar {
      background-image: url('/assets/avatar-placeholder.png');
      background-size: cover;
      background-position: center;
    }
    mat-card-content p {
      color: #444;
      line-height: 1.5;
    }
    mat-card-actions {
      display: flex;
      justify-content: space-between;
      padding: 8px 16px 16px;
    }
  `],
})
export class GuestPostCardComponent {
  @Input() post!: PublicPostSummary;
  imageUrl: string | null = null;

  constructor(private router: Router) {}
  goLogin() { this.router.navigateByUrl('/auth/login'); }
}
