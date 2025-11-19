import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface EditPostData {
  title: string;
  body: string;
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
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-raised-button color="primary" (click)="dialogRef.close(data)">
        Save
      </button>
    </mat-dialog-actions>
  `,
})
export class EditPostDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<EditPostDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditPostData
  ) {}
}
