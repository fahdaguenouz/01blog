// src/app/post/create-post.component.ts
import { Component, OnInit, ViewChildren, QueryList, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';  // ✅ For ngModel
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Category, PostService } from '../services/post.service';
import { ToastrService } from 'ngx-toastr';
import { CategoryService } from '../services/category.service';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';

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
    FormsModule,  // ✅ Required for ngModel
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatOptionModule
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
              <input matInput formControlName="title" placeholder="Give your post a title..." />
              <mat-error *ngIf="postForm.get('title')?.hasError('required')">
                Title is required
              </mat-error>
            </mat-form-field>

            <!-- Body Field -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>What's on your mind?</mat-label>
              <textarea
                matInput
                formControlName="body"
                rows="8"
                placeholder="Share your thoughts, insights, or learning journey..."
              ></textarea>
              <mat-error *ngIf="postForm.get('body')?.hasError('required')">
                Description is required
              </mat-error>
            </mat-form-field>

            <!-- Category multi-select -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Categories</mat-label>
              <mat-select formControlName="categoryIds" multiple>
                <mat-option *ngFor="let cat of allCategories" [value]="cat.id">
                  {{ cat.name }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <!-- Dynamic Media Sections -->
            <div class="media-sections" *ngIf="mediaBlocks.length > 0 || showAddMedia">
              <div class="section-header">
                <h3>Media Attachments</h3>
                <button type="button" mat-stroked-button (click)="addMediaBlock()" *ngIf="mediaBlocks.length < 10">
                  <mat-icon>add</mat-icon> Add Media
                </button>
              </div>

              <div class="media-block" *ngFor="let block of mediaBlocks; let i = index" [attr.data-id]="block.tempId">
                <div class="media-header">
                  <h4>Media {{ i + 1 }}</h4>
                  <button type="button" mat-icon-button color="warn" (click)="removeMediaBlock(i)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>

                <!-- File Upload -->
                <div class="file-upload-area">
                  <input
                    #fileInput
                    type="file"
                    hidden
                    [attr.data-index]="i"
                    (change)="onFileSelected($event, i)"
                    accept="image/*,video/*"
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
                  <small class="file-hint" *ngIf="!getFileName(i)">Supports JPG, PNG, MP4, MOV (max 50MB)</small>
                </div>

                <!-- Description -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Media Description/Caption (Optional)</mat-label>
                  <textarea
                    matInput
                    [(ngModel)]="block.description"
                    [placeholder]="'Describe this ' + (getFileName(i) ? 'media' : 'media block') + '...'"
                    maxlength="500"
                  ></textarea>
                  <mat-hint>Max 500 characters</mat-hint>
                </mat-form-field>
              </div>
            </div>

            <!-- Show Add Media button if no sections -->
            <div class="add-media-prompt" *ngIf="mediaBlocks.length === 0">
              <button type="button" mat-outlined-button class="add-first-media" (click)="addMediaBlock()">
                <mat-icon>image</mat-icon>
                Add your first image or video
              </button>
              <p class="hint">Enhance your post with photos or videos (optional)</p>
            </div>

            <!-- Actions -->
            <div class="form-actions">
              <button type="button" mat-button (click)="cancel()">Cancel</button>
              <button
                type="submit"
                mat-raised-button
                color="primary"
                [disabled]="postForm.invalid || isSubmitting || hasInvalidMedia"
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

    /* ✅ Media Styles */
    .media-sections { margin: 24px 0; }
    .section-header { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      margin-bottom: 16px; 
    }
    .section-header h3 { margin: 0; font-size: 1.2rem; color: #333; }
    
    .media-block { 
      background: #fafafa; 
      border: 2px dashed #e0e0e0; 
      border-radius: 12px; 
      padding: 20px; 
      margin-bottom: 16px; 
      transition: all 0.2s ease; 
    }
    .media-block:hover { border-color: #1976d2; }
    
    .media-header { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      margin-bottom: 16px; 
    }
    .media-header h4 { margin: 0; font-size: 1.1rem; color: #1976d2; }
    
    .file-upload-area { margin-bottom: 16px; }
    .file-btn { 
      width: 100%; 
      justify-content: flex-start; 
      text-transform: none; 
    }
    .file-hint { 
      display: block; 
      color: #666; 
      margin-top: 4px; 
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
      min-width: 200px; 
    }
    .hint { 
      color: #666; 
      margin: 0; 
      font-size: 0.95rem; 
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

    .spin {
      animation: spin 1s linear infinite;
      width: 20px;
      height: 20px;
      margin-right: 8px;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
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

      .section-header { 
        flex-direction: column; 
        gap: 12px; 
        text-align: center; 
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
  `]
})
export class CreatePostComponent implements OnInit, AfterViewInit {
  @ViewChildren('fileInput') fileInputs!: QueryList<ElementRef<HTMLInputElement>>;

  postForm: FormGroup;
  mediaBlocks: MediaBlock[] = [];
  showAddMedia = false;
  isSubmitting = false;
  allCategories: Category[] = [];

  constructor(
    private postService: PostService,
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.postForm = this.fb.group({
      title: ['', Validators.required],
      body: ['', Validators.required],
      categoryIds: [[]]
    });
  }

  ngOnInit(): void {
    this.categoryService.list().subscribe({
      next: (cats) => this.allCategories = cats,
      error: (err) => console.error('Failed to load categories:', err)
    });
  }

  ngAfterViewInit(): void {
    this.fileInputs.changes.subscribe(() => {
      // Optional: Log when file inputs change
    });
  }

  addMediaBlock(): void {
    const tempId = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.mediaBlocks.push({ file: null, description: '', tempId });
    this.showAddMedia = true;
  }

  removeMediaBlock(index: number): void {
    this.mediaBlocks.splice(index, 1);
    if (this.mediaBlocks.length === 0) {
      this.showAddMedia = false;
    }
  }

  triggerFileInput(index: number): void {
    const fileInput = this.fileInputs?.toArray()[index];
    if (fileInput) {
      fileInput.nativeElement.click();
    }
  }

  onFileSelected(event: Event, blockIndex: number): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validation
      if (file.size > 50 * 1024 * 1024) {  // 50MB
        this.toastr.error('File too large. Max 50MB.');
        target.value = '';
        return;
      }
      
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        this.toastr.error('Only images and videos allowed.');
        target.value = '';
        return;
      }
      
      this.mediaBlocks[blockIndex].file = file;
      target.value = '';  // Reset for re-selection
      this.toastr.success(`Added ${file.name}`);
    }
  }

  getFileName(index: number): string | null {
    return this.mediaBlocks[index]?.file?.name || null;
  }

  get hasInvalidMedia(): boolean {
    return this.mediaBlocks.some(block => block.file === null && block.description.trim().length > 0);
  }

  private buildFormData(): FormData {
    const formData = new FormData();
    const formValue = this.postForm.value;

    formData.append('title', formValue.title || '');
    formData.append('body', formValue.body || '');
    
    // Categories
    if (formValue.categoryIds && formValue.categoryIds.length > 0) {
      formValue.categoryIds.forEach((id: string) => {
        formData.append('categoryIds', id);
      });
    }

    // Multiple media + descriptions
    this.mediaBlocks.forEach((block) => {
      if (block.file) {
        formData.append('mediaFiles', block.file);
      }
      if (block.description.trim()) {
        formData.append('mediaDescriptions', block.description.trim());
      }
    });

    return formData;
  }

  createPost(): void {
    if (this.postForm.invalid || this.hasInvalidMedia) {
      this.toastr.warning('Please fix form errors before publishing.');
      this.postForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formData = this.buildFormData();

    this.postService.createPostFormData(formData).subscribe({
      next: () => {
        this.toastr.success('Post published successfully!');
        this.router.navigate(['/feed']);
      },
      error: (err) => {
        console.error('Post creation failed:', err);
        this.toastr.error('Error publishing post. Please try again.');
        this.isSubmitting = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/feed']);
  }
}
