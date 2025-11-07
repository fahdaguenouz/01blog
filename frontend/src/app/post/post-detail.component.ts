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
      <small>{{ post.createdAt | date : 'medium' }}</small>

      <img
        *ngIf="post.mediaUrl && post.mediaType === 'image'"
        [src]="post.mediaUrl"
        alt="Post media"
        style="width:100%;max-height:500px;object-fit:cover;margin:12px 0;"
      />
      <video
        *ngIf="post.mediaUrl && post.mediaType === 'video'"
        controls
        style="width:100%;max-height:500px;object-fit:cover;margin:12px 0;"
      >
        <source [src]="post.mediaUrl" />
      </video>

      <p>{{ post.description }}</p>
    </mat-card>
  `,
})
export class PostDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private posts = inject(PostService);
  post: Post | null = null;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.posts.getById(id).subscribe((p: Post) => {
      this.post = p;
    });
  }
}
