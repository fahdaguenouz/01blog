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
import { FormsModule, ValidationErrors, ValidatorFn } from '@angular/forms';
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

import { PostService, Category } from '../../services/post.service';
import { CategoryService } from '../../services/category.service';
import { noHtmlTags, notBlank } from '../../../helper/text.validator';
import { SnackService } from '../../core/snack.service';

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
  templateUrl: './create-post.component.html',
  styleUrls: ['./create-post.component.scss'],
})
export class CreatePostComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('fileInput') fileInputs!: QueryList<ElementRef<HTMLInputElement>>;

  private previewUrls: string[] = [];

  postForm: FormGroup;
  mediaBlocks: MediaBlock[] = [];
  isSubmitting = false;
  allCategories: Category[] = [];

  constructor(
    private fb: FormBuilder,
    private postService: PostService,
    private categoryService: CategoryService,
    private router: Router,
    private snack: SnackService,
    private cdr: ChangeDetectorRef
  ) {
    this.postForm = this.fb.group({
      title: ['', [Validators.required, notBlank(), noHtmlTags(), Validators.maxLength(150)]],
      body: ['', [Validators.required, notBlank(), noHtmlTags(), Validators.maxLength(5000)]],
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
      error: (err) => {
        // console.error('Categories load failed:', err);
        this.snack.error('Failed to load categories');
      },
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

  moveMediaUp(index: number): void {
    if (index === 0) return;
    const temp = this.mediaBlocks[index];
    const tempUrl = this.previewUrls[index];

    this.mediaBlocks[index] = this.mediaBlocks[index - 1];
    this.previewUrls[index] = this.previewUrls[index - 1];

    this.mediaBlocks[index - 1] = temp;
    this.previewUrls[index - 1] = tempUrl;

    this.cdr.detectChanges();
  }

  moveMediaDown(index: number): void {
    if (index === this.mediaBlocks.length - 1) return;
    const temp = this.mediaBlocks[index];
    const tempUrl = this.previewUrls[index];

    this.mediaBlocks[index] = this.mediaBlocks[index + 1];
    this.previewUrls[index] = this.previewUrls[index + 1];

    this.mediaBlocks[index + 1] = temp;
    this.previewUrls[index + 1] = tempUrl;

    this.cdr.detectChanges();
  }

  triggerFileInput(index: number): void {
    this.fileInputs.toArray()[index]?.nativeElement.click();
  }

  onFileSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      this.snack.error('Max file size is 20MB');
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
      this.snack.error('Please fix form errors.');
      this.postForm.markAllAsTouched();
      return;
    }
  for (let i = 0; i < this.mediaBlocks.length; i++) {
    const block = this.mediaBlocks[i];
    const hasFile = !!block.file;
    const desc = (block.description ?? '').trim();

    if (hasFile && !desc) {
      this.snack.error(`Description is required for media #${i + 1}`);
      return;
    }

    if (desc && /<[^>]*>/.test(desc)) {
      this.snack.error(`Media description #${i + 1} cannot contain HTML.`);
      return;
    }
  }
    const fd = new FormData();
    const formValue = this.postForm.value;

    fd.append('title', formValue.title);
    fd.append('body', formValue.body);

    formValue.categoryIds.forEach((id: string) => {
      fd.append('categoryIds', id);
    });
    for (const block of this.mediaBlocks) {
    if (!block.file) continue; // blocks without file are ignored
    fd.append('mediaFiles', block.file);
    fd.append('mediaDescriptions', (block.description ?? '').trim());
  }

    this.isSubmitting = true;
    this.postService.createPostFormData(fd).subscribe({
      next: () => {
        this.snack.success('Post created successfully!');
        this.router.navigate(['/feed']);
      },
      error: (error) => {
        // console.error('Post creation failed:', error);
        const msg =
        error?.error?.message ||
        error?.error?.error ||
        'Failed to create post';
        // this.snack.error(msg);

      this.snack.error(msg);
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
