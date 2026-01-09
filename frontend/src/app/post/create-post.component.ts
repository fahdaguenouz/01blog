// src/app/post/create-post.component.ts
import {
  Component,
  OnInit,
  ViewChildren,
  QueryList,
  ElementRef,
  AfterViewInit,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

import { ToastrService } from 'ngx-toastr';
import { PostService, Category } from '../services/post.service';
import { CategoryService } from '../services/category.service';

interface MediaBlock {
  file: File | null;
  description: string;
  tempId: string;
}

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
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
            <!-- Title -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Post Title *</mat-label>
              <input matInput formControlName="title" placeholder="Give your post a title..." />
              <mat-error *ngIf="postForm.get('title')?.hasError('required')">
                Title is required
              </mat-error>
            </mat-form-field>

            <!-- Body -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description *</mat-label>
              <textarea
                matInput
                rows="8"
                formControlName="body"
                placeholder="Share your thoughts..."
              ></textarea>
              <mat-error *ngIf="postForm.get('body')?.hasError('required')">
                Description is required
              </mat-error>
            </mat-form-field>

            <!-- Categories -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Categories * (Select at least 1)</mat-label>
              <mat-select formControlName="categoryIds" multiple>
                <mat-option *ngFor="let cat of allCategories" [value]="cat.id">
                  {{ cat.name }}
                </mat-option>
              </mat-select>
              <mat-error *ngIf="postForm.get('categoryIds')?.hasError('required')">
                At least one category is required
              </mat-error>
            </mat-form-field>

            <!-- Media -->
            <div class="media-sections" *ngIf="mediaBlocks.length > 0">
              <div class="section-header">
                <h3>Media Attachments (Optional)</h3>
                <button
                  type="button"
                  mat-stroked-button
                  (click)="addMediaBlock()"
                  *ngIf="mediaBlocks.length < 10"
                >
                  <mat-icon>add</mat-icon>
                  Add Media
                </button>
              </div>

              <div
                class="media-block"
                *ngFor="let block of mediaBlocks; let i = index"
                [attr.data-id]="block.tempId"
              >
                <div class="media-header">
                  <h4>Media {{ i + 1 }}</h4>
                  <button type="button" mat-icon-button color="warn" (click)="removeMediaBlock(i)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>

                <input
                  #fileInput
                  type="file"
                  hidden
                  accept="image/*,video/*"
                  (change)="onFileSelected($event, i)"
                />

                <button
                  type="button"
                  mat-stroked-button
                  class="file-btn"
                  (click)="triggerFileInput(i)"
                >
                  <mat-icon>attach_file</mat-icon>
                  {{ getFileName(i) || 'Choose Image or Video' }}
                </button>

                <!-- ✅ FIXED Preview - Safe null checks -->
                <div class="media-preview" *ngIf="getFileName(i)">
                  <img
                    *ngIf="mediaBlocks[i].file && isImage(mediaBlocks[i].file!)"
                    [src]="getPreview(i)"
                    alt="Preview"
                  />
                  <video
                    *ngIf="mediaBlocks[i].file && isVideo(mediaBlocks[i].file!)"
                    [src]="getPreview(i)"
                    controls
                    style="max-width: 100%; max-height: 180px;"
                  ></video>
                </div>

                <!-- Description - ✅ FIXED with standalone -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Media Caption (Optional)</mat-label>
                  <textarea
                    matInput
                    [(ngModel)]="block.description"
                    [ngModelOptions]="{ standalone: true }"
                    maxlength="500"
                  ></textarea>
                </mat-form-field>
              </div>
            </div>

            <div class="add-media-prompt" *ngIf="mediaBlocks.length === 0">
              <button
                type="button"
                mat-outlined-button
                class="add-first-media"
                (click)="addMediaBlock()"
              >
                <mat-icon>image</mat-icon>
                Add image or video (optional)
              </button>
            </div>

            <!-- Actions -->
            <div class="form-actions">
              <button type="button" mat-button (click)="cancel()">Cancel</button>
              <button
                type="submit"
                mat-raised-button
                color="primary"
                [disabled]="isSubmitting || postForm.invalid || hasInvalidMedia"
              >
                <span *ngIf="!isSubmitting">Publish Post</span>
                <span *ngIf="isSubmitting">
                  <mat-icon class="spin">autorenew</mat-icon>
                  Publishing...
                </span>
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .create-post-container {
        max-width: 700px;
        margin: 32px auto;
        padding: 16px;
      }
      .full-width {
        width: 100%;
        margin-bottom: 20px;
      }
      .media-sections {
        margin: 24px 0;
      }
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .section-header h3 {
        margin: 0;
        font-size: 1.2rem;
        color: #333;
      }
      .media-block {
        background: #fafafa;
        border: 2px dashed #e0e0e0;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 16px;
        transition: border-color 0.2s;
      }
      .media-block:hover {
        border-color: #1976d2;
      }
      .media-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .media-header h4 {
        margin: 0;
        font-size: 1.1rem;
        color: #1976d2;
      }
      .file-btn {
        width: 100%;
        justify-content: flex-start;
        text-transform: none;
        margin-bottom: 12px;
      }
      .media-preview {
        margin: 12px 0;
        text-align: center;
      }
      .media-preview img,
      .media-preview video {
        max-width: 100%;
        max-height: 180px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      .add-media-prompt {
        text-align: center;
        padding: 32px 16px;
        border: 2px dashed #e0e0e0;
        border-radius: 12px;
        margin: 24px 0;
        background: #f9f9f9;
      }
      .add-first-media {
        display: block;
        margin: 0 auto 8px;
        min-width: 220px;
      }
      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 32px;
      }
      .spin {
        animation: spin 1s linear infinite;
        width: 20px;
        height: 20px;
        margin-right: 8px;
      }
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
      @media (max-width: 600px) {
        .create-post-container {
          margin: 16px auto;
          padding: 8px;
        }
        .media-block {
          padding: 16px;
        }
        .form-actions {
          flex-direction: column;
        }
        .form-actions button {
          width: 100%;
        }
      }
    `,
  ],
})
export class CreatePostComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('fileInput') fileInputs!: QueryList<ElementRef<HTMLInputElement>>;

  private previewUrls: string[] = []; // ✅ Stable preview tracking

  postForm: FormGroup;
  mediaBlocks: MediaBlock[] = [];
  isSubmitting = false;
  allCategories: Category[] = [];

  constructor(
    private fb: FormBuilder,
    private postService: PostService,
    private categoryService: CategoryService,
    private router: Router,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.postForm = this.fb.group({
      title: ['', Validators.required],
      body: ['', Validators.required],
      categoryIds: [[], [Validators.required, this.atLeastOneValidator()]],
    });
  }

  private atLeastOneValidator(): (control: AbstractControl) => { [key: string]: any } | null {
    return (control) => {
      return Array.isArray(control.value) && control.value.length > 0 ? null : { required: true };
    };
  }

  ngOnInit(): void {
    this.categoryService.list().subscribe({
      next: (cats) => {
        this.allCategories = cats;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Categories load failed:', err),
    });
  }

  ngAfterViewInit(): void {}

  addMediaBlock(): void {
    this.mediaBlocks.push({
      file: null,
      description: '',
      tempId: crypto.randomUUID(),
    });
    this.previewUrls.push('');
    this.cdr.detectChanges();
  }

  removeMediaBlock(index: number): void {
    if (this.previewUrls[index]) {
      URL.revokeObjectURL(this.previewUrls[index]);
    }
    this.mediaBlocks.splice(index, 1);
    this.previewUrls.splice(index, 1);
    this.cdr.detectChanges();
  }

  triggerFileInput(index: number): void {
    this.fileInputs.toArray()[index]?.nativeElement.click();
  }

  onFileSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      this.toastr.error('Max file size is 20MB');
      input.value = '';
      return;
    }

    if (this.previewUrls[index]) {
      URL.revokeObjectURL(this.previewUrls[index]);
    }

    this.mediaBlocks[index].file = file;
    this.previewUrls[index] = URL.createObjectURL(file);
    input.value = '';
    this.cdr.detectChanges();
  }

  getPreview(index: number): string {
    return this.previewUrls[index] || '';
  }

  // ✅ FIXED: Non-null assertion since *ngIf already checks
  isImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  isVideo(file: File): boolean {
    return file.type.startsWith('video/');
  }

  getFileName(i: number): string | null {
    return this.mediaBlocks[i]?.file?.name || null;
  }

  get hasInvalidMedia(): boolean {
    return this.mediaBlocks.some((block) => !block.file && block.description.trim());
  }

  createPost(): void {
    if (this.postForm.invalid || this.hasInvalidMedia) {
      this.toastr.warning('Please fix form errors.');
      this.postForm.markAllAsTouched();
      return;
    }

    const fd = new FormData();
    const formValue = this.postForm.value;

    fd.append('title', formValue.title);
    fd.append('body', formValue.body);

    formValue.categoryIds.forEach((id: string) => {
      fd.append('categoryIds', id);
    });

    this.mediaBlocks.forEach((block) => {
      if (block.file) fd.append('mediaFiles', block.file);
      if (block.description.trim()) fd.append('mediaDescriptions', block.description.trim());
    });

    this.isSubmitting = true;
    this.postService.createPostFormData(fd).subscribe({
      next: (response) => {
        this.toastr.success('Post created successfully!');
        this.router.navigate(['/feed']);
      },
      error: (error) => {
        console.error('Post creation failed:', error);
        this.toastr.error('Failed to create post');
        this.isSubmitting = false;
      },
    });
  }

  cancel(): void {
    this.previewUrls.forEach((url) => url && URL.revokeObjectURL(url));
    this.router.navigate(['/feed']);
  }

  ngOnDestroy(): void {
    this.previewUrls.forEach((url) => url && URL.revokeObjectURL(url));
  }
}
