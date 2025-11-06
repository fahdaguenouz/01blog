// src/app/post/create-post.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PostService } from '../services/post.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    ReactiveFormsModule,
  ],
  template: `
    <div class="create-post-container">
      <mat-card class="create-post-card">
        <mat-card-header>
          <mat-card-title>Create a New Post</mat-card-title>
          <mat-card-subtitle>Share your learning experience with the community</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="postForm" (ngSubmit)="createPost()">
            <!-- Title Field -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Post Title</mat-label>
              <input matInput formControlName="title" placeholder="Give your post a title...">
              <mat-error *ngIf="postForm.get('title')?.hasError('required')">Title is required</mat-error>
            </mat-form-field>

            <!-- Description Field -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>What's on your mind?</mat-label>
              <textarea
                matInput
                formControlName="description"
                rows="8"
                placeholder="Share your thoughts, insights, or learning journey..."
              ></textarea>
              <mat-error *ngIf="postForm.get('description')?.hasError('required')">Description is required</mat-error>
            </mat-form-field>

            <!-- Media Upload -->
            <div class="media-section">
              <label class="media-label">Attach Image or Video (Optional)</label>
              <div class="media-upload">
                <input
                  type="file"
                  #fileInput
                  hidden
                  (change)="onFileSelected($event)"
                  accept="image/*,video/*"
                />
                <button type="button" mat-stroked-button (click)="fileInput.click()">
                  <mat-icon>attach_file</mat-icon>
                  Choose File
                </button>
                <span class="file-name" *ngIf="selectedFileName">{{ selectedFileName }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="form-actions">
              <button type="button" mat-button (click)="cancel()">Cancel</button>
              <button type="submit" mat-raised-button color="primary" [disabled]="postForm.invalid || isSubmitting">
                <span *ngIf="!isSubmitting">Publish Post</span>
                <span *ngIf="isSubmitting">Publishing...</span>
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .create-post-container {
      max-width: 700px;
      margin: 32px auto;
      padding: 16px;
    }

    .create-post-card {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
      border-radius: 8px;
    }

    .create-post-card mat-card-header {
      margin-bottom: 24px;
    }

    .create-post-card mat-card-title {
      font-size: 1.5rem;
      margin: 0;
    }

    .create-post-card mat-card-subtitle {
      font-size: 0.95rem;
      color: #666;
      margin-top: 4px;
    }

    mat-card-content {
      padding: 24px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 20px;
    }

    .media-section {
      margin: 20px 0;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 6px;
    }

    .media-label {
      display: block;
      font-weight: 500;
      margin-bottom: 12px;
      color: #333;
    }

    .media-upload {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .file-name {
      font-size: 0.9rem;
      color: #666;
      word-break: break-word;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }

    .form-actions button {
      min-width: 120px;
    }

    @media (max-width: 600px) {
      .create-post-container {
        margin: 16px auto;
        padding: 8px;
      }

      mat-card-content {
        padding: 16px;
      }

      .full-width {
        margin-bottom: 16px;
      }

      .form-actions {
        flex-direction: column;
      }

      .form-actions button {
        width: 100%;
      }
    }
  `]
})
export class CreatePostComponent {
  postForm: FormGroup;
  selectedFile: File | null = null;
  selectedFileName: string | null = null;
  isSubmitting = false;

  constructor(
    private postService: PostService,
    private fb: FormBuilder,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.postForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required]
    });
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
      this.selectedFileName = files[0].name;
    }
  }

  createPost() {
    if (this.postForm.invalid) return;

    this.isSubmitting = true;
    const { title, description } = this.postForm.value;

    this.postService.createPost(title, description, this.selectedFile || undefined).subscribe({
      next: () => {
        this.toastr.success('Post published successfully!');
        this.router.navigate(['/feed']);
      },
      error: () => {
        this.toastr.error('Error publishing post');
        this.isSubmitting = false;
      }
    });
  }

  cancel() {
    this.router.navigate(['/feed']);
  }
}
