import { Component, Inject, OnDestroy, QueryList, ViewChildren, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { finalize } from 'rxjs/operators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Category, Post, PostService } from '../../services/post.service';
import { CategoryService } from '../../services/category.service';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface EditMediaBlock {
  id?: string;
  tempId?: string;
  file?: File | null;
  existingUrl?: string;
  url?: string;
  description: string;
  position: number;
  removed?: boolean;
}

export interface EditPostData {
  id: string;
  title: string;
  body: string;
  mediaBlocks: EditMediaBlock[];
  categoryIds: string[];
}

@Component({
  standalone: true,
  selector: 'app-edit-post-dialog',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatIconModule,
    MatSelectModule,
    MatOptionModule,
    CommonModule,
  ],
  templateUrl: './edit-post-component.html',
  styleUrls: ['./edit-post-component.scss'],
})
export class EditPostDialogComponent implements OnDestroy {
  postForm!: FormGroup;
  categories: Category[] = [];
  isSubmitting = false;
  private previewUrls: string[] = [];

  // Store references to all file inputs
  @ViewChildren('fileInput') fileInputs!: QueryList<ElementRef<HTMLInputElement>>;

  constructor(
    public dialogRef: MatDialogRef<EditPostDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditPostData,
    private categoryService: CategoryService,
    private fb: FormBuilder,
    private postService: PostService
  ) {
    this.initializeForm();
    this.loadCategories();
    this.initializeMediaBlocks();
  }

  private initializeForm() {
    this.postForm = this.fb.group({
      title: [this.data.title, [Validators.required]],
      body: [this.data.body, [Validators.required]],
      categoryIds: [[...this.data.categoryIds], [Validators.required]],
    });
  }

  private loadCategories() {
    this.categoryService.list().subscribe({
      next: (cats) => (this.categories = cats),
      error: (err) => console.error('edit dialog category load error', err),
    });
  }

private initializeMediaBlocks() {
  this.data.mediaBlocks.forEach((block, index) => {
    if (!block.tempId) block.tempId = `temp-${Date.now()}-${index}`;

    // Ensure position is set
    block.position = index + 1;

    // Pre-generate preview for existing media
    if (block.existingUrl && !block.file) {
      this.previewUrls[index] = block.existingUrl;
    }
  });
}


  get hasInvalidMedia(): boolean {
    return this.data.mediaBlocks.some((block) => block.file && block.file.size > 20 * 1024 * 1024);
  }

  isImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  isVideo(file: File): boolean {
    return file.type.startsWith('video/');
  }

  isImageUrl(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  }

  isVideoUrl(url: string): boolean {
    return /\.(mp4|webm|ogg)$/i.test(url);
  }

  getFileName(index: number): string | null {
    return this.data.mediaBlocks[index]?.file?.name || null;
  }

 getPreview(index: number): string {
  const block = this.data.mediaBlocks[index];
  if (!block) return '';

  // Use cached preview first (for both file and existing)
  if (this.previewUrls[index]) {
    return this.previewUrls[index];
  }

  // Fallback: create for new file
  if (block.file) {
    this.previewUrls[index] = URL.createObjectURL(block.file);
    return this.previewUrls[index];
  }

  // Fallback: existing URL
  if (block.existingUrl) {
    this.previewUrls[index] = block.existingUrl;
    return this.previewUrls[index];
  }

  return '';
}

  triggerFileInput(index: number) {
    const inputRef = this.fileInputs.toArray()[index];
    if (inputRef) inputRef.nativeElement.click();
  }

 onFileSelected(event: Event, index: number) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (file.size > 20 * 1024 * 1024) {
    alert('Max file size is 20MB');
    input.value = '';
    return;
  }

  // Clean up previous preview
  if (this.previewUrls[index]) {
    URL.revokeObjectURL(this.previewUrls[index]);
  }

  // Replace block (clears existingUrl, keeps id for backend tracking)
  this.data.mediaBlocks[index] = {
    ...this.data.mediaBlocks[index],
    file,
    existingUrl: undefined,  // Clear existing preview
    tempId: `temp-${Date.now()}-${index}`,
    position: index + 1,
  };
  this.previewUrls[index] = URL.createObjectURL(file);

  // Reset input
  input.value = '';
}

addMediaBlock() {
  const newBlock: EditMediaBlock = {
    tempId: `temp-${Date.now()}-${this.data.mediaBlocks.length}`,
    description: '',
    position: this.data.mediaBlocks.length + 1,
  };
  this.data.mediaBlocks.push(newBlock);
}
  removeMediaBlock(index: number) {
  const block = this.data.mediaBlocks[index];
  if (block.file && this.previewUrls[index]) {
    URL.revokeObjectURL(this.previewUrls[index]);
  }

  // Mark for backend removal (don't splice, keep for FormData)
  block.removed = true;
  
  // Reorder remaining blocks' positions
  this.data.mediaBlocks.forEach((b, i) => {
    if (!b.removed) b.position = i + 1;
  });
}

 updatePost() {
  if (this.postForm.invalid || this.hasInvalidMedia) {
    alert('Please fix form errors');
    return;
  }

  this.isSubmitting = true;

  const title = this.postForm.get('title')!.value;
  const body = this.postForm.get('body')!.value;
  const categoryIds = this.postForm.get('categoryIds')!.value;

  // Filter valid (non-removed) blocks for processing
  // const validBlocks = this.data.mediaBlocks.filter(block => !block.removed);

  // Prepare FormData for backend
  this.postService.updatePost(
    this.data.id,
    this.postForm.value.title,
    this.postForm.value.body,
    this.data.mediaBlocks,  
    this.postForm.value.categoryIds
  ).pipe(
    // Refresh previews after potential array changes
    finalize(() => this.isSubmitting = false)
  ).subscribe({
    next: (updatedPost: Post) => {
      this.dialogRef.close(updatedPost);
    },
    error: (err) => {
      console.error('Update failed:', err);
      alert(`Update failed: ${err.error?.message || 'Unknown error'}`);
    }
  });
}
  cancel() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.previewUrls.forEach((url) => url && URL.revokeObjectURL(url));
  }
}
