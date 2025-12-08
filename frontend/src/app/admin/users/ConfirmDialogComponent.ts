
/**
 * Simple ConfirmDialogComponent for reuse.
 * Put this component in the same file or separate file. It's a minimal material dialog component.
 */
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Component as NgComponent } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@NgComponent({
  standalone: true,
  selector: 'app-confirm-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="close(false)">No</button>
      <button mat-button (click)="close(true)" cdkFocusInitial>Yes</button>
    </mat-dialog-actions>
  `,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
})
export class ConfirmDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string; message: string }
  ) {}

  close(result: boolean) {
    this.dialogRef.close(result);
  }
}
