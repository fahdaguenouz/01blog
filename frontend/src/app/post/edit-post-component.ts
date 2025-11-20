import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface EditPostData {
  title: string;
  body: string;
  media?: File | null;
}

@Component({
  standalone: true,
  selector: 'app-edit-post-dialog',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule,MatDialogModule,   // dialog
    MatInputModule,],
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

      <div style="margin-top: 12px;">
        <label>Media (optional)</label>
        <input type="file" (change)="onFileSelected($event)" />
        <div *ngIf="selectedFileName">
          Current selection: {{ selectedFileName }}
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSave()">
        Save
      </button>
    </mat-dialog-actions>
  `,
})
export class EditPostDialogComponent {
  selectedFileName = '';

  constructor(
    public dialogRef: MatDialogRef<EditPostDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditPostData
  ) {}

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