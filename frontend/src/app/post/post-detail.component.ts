// src/app/post/post-detail.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { PostService, Post } from '../services/post.service';

@Component({
  standalone: true,
  selector: 'app-post-detail',
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card *ngIf="post">
      <h2>{{ post.title }}</h2>
      <small>{{ post.createdAt | date:'medium' }}</small>
      <p>{{ post.description }}</p>
    </mat-card>
  `
})
export class PostDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private posts = inject(PostService);
  post: Post | null = null;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.posts.getById(id).subscribe((p: Post) => { this.post = p; });
  }
}
