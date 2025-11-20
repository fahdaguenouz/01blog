import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Category } from '../services/post.service';
import { CategoryService } from '../services/category.service';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';

export interface EditPostData {
  title: string;
  body: string;
  media?: File | null;
  categoryIds: string[];
}

@Component({
  standalone: true,
  selector: 'app-edit-post-dialog',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    CommonModule, 
  ],
  template: `
    <h2 mat-dialog-title>Edit post</h2>

    <mat-dialog-content>
      <mat-form-field class="full-width">
        <mat-label>Title</mat-label>
        <input matInput [(ngModel)]="data.title" />
      </mat-form-field>

      <mat-form-field class="full-width">
        <mat-label>Content</mat-label>
        <textarea matInput rows="5" [(ngModel)]="data.body"></textarea>
      </mat-form-field>

      <mat-form-field class="full-width">
        <mat-label>Categories</mat-label>
        <mat-select [(ngModel)]="data.categoryIds" multiple>
          <mat-option *ngFor="let cat of categories" [value]="cat.id">
            {{ cat.name }}
          </mat-option>
        </mat-select>
      </mat-form-field>

      <div style="margin-top: 12px;">
        <label>Media (optional)</label>
        <input type="file" (change)="onFileSelected($event)" />
        <div *ngIf="selectedFileName">Current selection: {{ selectedFileName }}</div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSave()">Save</button>
    </mat-dialog-actions>
  `,
})
export class EditPostDialogComponent {
  selectedFileName = '';
  categories: Category[] = [];

  constructor(
    public dialogRef: MatDialogRef<EditPostDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditPostData,
    private categoryService: CategoryService
  ) {
    this.categoryService.list().subscribe({
      next: (cats) => {
        console.log('edit dialog categories', cats);
        this.categories = cats;
      },
      error: (err) => {
        console.error('edit dialog category load error', err);
      },
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (file) {
      this.data.media = file;
      this.selectedFileName = file.name;
    } else {
      this.data.media = null;
      this.selectedFileName = '';
    }
  }

  onSave() {
    this.dialogRef.close(this.data);
  }
}
