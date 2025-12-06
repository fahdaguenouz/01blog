import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

export interface ReportPostDialogData {
  authorName: string;
  postTitle: string;
}

export interface ReportPostDialogResult {
  category: string;
  reason: string;
}

@Component({
  standalone: true,
  selector: 'app-report-post-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Report post</h2>
    <div mat-dialog-content>
      <p>
        You are reporting the post
        <strong>"{{ data.postTitle }}"</strong> by
        <strong>{{ data.authorName }}</strong>.
      </p>

      <mat-form-field appearance="fill" class="full-width">
        <mat-label>Category</mat-label>
        <mat-select [(ngModel)]="category" name="category" required>
          <mat-option value="spam">Spam or misleading</mat-option>
          <mat-option value="abuse">Harassment or hate</mat-option>
          <mat-option value="nudity">Nudity or sexual content</mat-option>
          <mat-option value="other">Other</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="fill" class="full-width">
        <mat-label>Describe the issue</mat-label>
        <textarea
          matInput
          rows="4"
          [(ngModel)]="reason"
          name="reason"
          required>
        </textarea>
      </mat-form-field>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button
        mat-raised-button
        color="warn"
        [disabled]="!category || !reason.trim()"
        (click)="onSubmit()">
        Submit report
      </button>
    </div>
  `,
  styles: [`
    .full-width { width: 100%; }
  `],
})
export class ReportPostDialogComponent {
  category = '';
  reason = '';

  constructor(
    private ref: MatDialogRef<ReportPostDialogComponent, ReportPostDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: ReportPostDialogData
  ) {}

  onCancel() {
    this.ref.close();
  }

  onSubmit() {
    this.ref.close({ category: this.category, reason: this.reason.trim() });
  }
}
