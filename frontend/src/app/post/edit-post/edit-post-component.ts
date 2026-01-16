import { Component, Inject, OnDestroy, QueryList, ViewChildren, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { noHtmlTags, notBlank } from '../../../helper/text.validator';

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

  // ✅ cache previews by stable key, not index
  private previewByKey = new Map<string, string>();

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

  private keyOf(block: EditMediaBlock): string {
    return block.tempId || block.id || '';
  }

  private initializeForm() {
    this.postForm = this.fb.group({
     title: [this.data.title, [Validators.required, notBlank(), noHtmlTags()]],
  body: [this.data.body, [Validators.required, notBlank(), noHtmlTags()]],
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
      if (block.removed == null) block.removed = false;

      // normalize existing url
      if (!block.existingUrl && block.url) block.existingUrl = block.url;

      block.position = index + 1;

      // ✅ preload existing preview into map
      const key = this.keyOf(block);
      if (key && block.existingUrl && !block.file) {
        this.previewByKey.set(key, block.existingUrl);
      }
    });
  }

  get hasInvalidMedia(): boolean {
    return this.data.mediaBlocks.some((b) => !!b.file && b.file.size > 20 * 1024 * 1024);
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

  // ✅ preview now takes block not index
  getPreview(block: EditMediaBlock): string {
    const key = this.keyOf(block);
    if (!key) return '';

    const cached = this.previewByKey.get(key);
    if (cached) return cached;

    if (block.file) {
      const objUrl = URL.createObjectURL(block.file);
      this.previewByKey.set(key, objUrl);
      return objUrl;
    }

    if (block.existingUrl) {
      this.previewByKey.set(key, block.existingUrl);
      return block.existingUrl;
    }

    return '';
  }

  // ✅ helper used in html
  hasPreview(block: EditMediaBlock): boolean {
    return !!block.file || !!block.existingUrl || !!this.previewByKey.get(this.keyOf(block));
  }

  // ✅ we must open the correct input for the VISIBLE block index
  triggerFileInput(visibleIndex: number) {
    const inputRef = this.fileInputs.toArray()[visibleIndex];
    if (inputRef) inputRef.nativeElement.click();
  }

  onFileSelected(event: Event, block: EditMediaBlock) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert('Max file size is 20MB');
      input.value = '';
      return;
    }

    const key = this.keyOf(block);

    // cleanup old preview if it was object url
    const old = key ? this.previewByKey.get(key) : null;
    if (old && old.startsWith('blob:')) URL.revokeObjectURL(old);

    // replace existing or set new
    block.file = file;
    block.removed = false;
    block.existingUrl = undefined;

    if (key) {
      const objUrl = URL.createObjectURL(file);
      this.previewByKey.set(key, objUrl);
    }

    input.value = '';
  }

  addMediaBlock() {
    const newBlock: EditMediaBlock = {
      tempId: `temp-${Date.now()}-${this.data.mediaBlocks.length}`,
      description: '',
      position: this.data.mediaBlocks.length + 1,
      removed: false,
      file: null,
    };
    this.data.mediaBlocks.push(newBlock);
  }

  removeMediaBlockByBlock(block: EditMediaBlock) {
    const idx = this.data.mediaBlocks.indexOf(block);
    if (idx === -1) return;
    this.removeMediaBlock(idx);
  }

  removeMediaBlock(index: number) {
    const block = this.data.mediaBlocks[index];
    const key = this.keyOf(block);

    // cleanup preview
    const old = key ? this.previewByKey.get(key) : null;
    if (old && old.startsWith('blob:')) URL.revokeObjectURL(old);
    if (key) this.previewByKey.delete(key);

    if (!block.id) {
      // new block remove completely
      this.data.mediaBlocks.splice(index, 1);
      return;
    }

    // existing block mark removed
    block.removed = true;
    block.file = undefined;
    block.existingUrl = undefined;
  }

  updatePost() {
    if (this.postForm.invalid || this.hasInvalidMedia) {
      alert('Please fix form errors');
      return;
    }

    const categoryIds: string[] = this.postForm.value.categoryIds || [];
    if (!categoryIds.length) {
      alert('Post must have at least one category');
      return;
    }

    const bad = this.data.mediaBlocks.find((b) => {
      const hasMedia = !!b.file || !!b.existingUrl;
      return !b.removed && hasMedia && (!b.description || !b.description.trim());
    });

    if (bad) {
      alert('Description is required for each media you keep/add.');
      return;
    }

    this.isSubmitting = true;

    this.postService
      .updatePost(
        this.data.id,
        this.postForm.value.title,
        this.postForm.value.body,
        this.data.mediaBlocks,
        categoryIds
      )
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (updatedPost: Post) => this.dialogRef.close(updatedPost),
        error: (err) => {
          console.error('Update failed:', err);
          alert(`Update failed: ${err.error?.message || 'Unknown error'}`);
        },
      });
  }

  cancel() {
    this.dialogRef.close();
  }

  trackByTempId = (_: number, b: EditMediaBlock) => b.tempId || b.id;

  get visibleMediaBlocks(): EditMediaBlock[] {
    return this.data.mediaBlocks.filter((b) => !b.removed);
  }

  ngOnDestroy() {
    // revoke all blob urls
    for (const url of this.previewByKey.values()) {
      if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    }
    this.previewByKey.clear();
  }
}
