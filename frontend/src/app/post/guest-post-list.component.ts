// src/app/public-posts/guest-post-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PublicPostsService, PublicPostSummary } from './public-posts.service';
import { GuestPostCardComponent } from './guest-post-card.component';

@Component({
  selector: 'app-guest-post-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatProgressSpinnerModule, GuestPostCardComponent],
  template: `
    <section class="posts-wrap">
      <div class="loading" *ngIf="loading">
        <mat-spinner diameter="36"></mat-spinner>
      </div>

      <ng-container *ngIf="!loading && posts.length; else emptyTpl">
        <app-guest-post-card *ngFor="let p of posts" [post]="p"></app-guest-post-card>
        <div class="pager">
          <button mat-stroked-button (click)="loadMore()" [disabled]="noMore">Load more</button>
        </div>
      </ng-container>

      <ng-template #emptyTpl>
        <p>No posts yet.</p>
      </ng-template>
    </section>
  `,
  styles: [`
    .posts-wrap { margin-top: 24px; }
    .loading { display: flex; justify-content: center; padding: 24px; }
    .pager { display: flex; justify-content: center; margin-top: 16px; }
  `]
})
export class GuestPostListComponent implements OnInit {
  posts: PublicPostSummary[] = [];
  page = 0;
  size = 6;
  totalPages = 0;
  loading = false;

  constructor(private postsSvc: PublicPostsService) {}

  ngOnInit() { this.fetch(); }

  get noMore() { return this.page + 1 >= this.totalPages && this.totalPages > 0; }

  fetch() {
    this.loading = true;
    this.postsSvc.list(this.page, this.size, 'active').subscribe({
      next: (res) => {
        this.posts.push(...res.content);
        this.totalPages = res.totalPages;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  loadMore() {
    if (this.noMore) return;
    this.page++;
    this.fetch();
  }
}
