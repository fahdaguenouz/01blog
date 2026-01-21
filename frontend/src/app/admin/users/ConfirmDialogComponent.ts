import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Component as NgComponent } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@NgComponent({
  standalone: true,
  selector: 'app-confirm-dialog',
  template: `
    <div class="confirm-dialog">
      <div class="dialog-header">
        <mat-icon class="dialog-icon" [class.warning]="isWarningAction()">
          {{ getIcon() }}
        </mat-icon>
        <h2 class="dialog-title">{{ data.title }}</h2>
      </div>
      
      <div class="dialog-content">
        <p>{{ data.message }}</p>
      </div>
      
      <div class="dialog-actions">
        <button mat-button (click)="close(false)" class="cancel-btn">
          Cancel
        </button>
        <button 
          mat-flat-button 
          [color]="isWarningAction() ? 'warn' : 'primary'"
          (click)="close(true)" 
          cdkFocusInitial
          class="confirm-btn">
          Confirm
        </button>
      </div>
    </div>
  `,
  styles: [`
  @use "../../../styles/variables" as *;

  .confirm-dialog {
    padding: 20px 22px;
    width: 100%;
    max-width: 420px;
    box-sizing: border-box;
    overflow: hidden; /* ✅ prevents weird scroll */
  }

  .dialog-header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 14px;

    .dialog-icon {
      font-size: 30px;
      width: 30px;
      height: 30px;
      color: $primary-color;

      &.warning {
        color: #e74c3c;
      }
    }

    .dialog-title {
      font-size: 20px;
      font-weight: 600;
      color: #333;
      margin: 0;
      line-height: 1.2;
    }
  }

  .dialog-content {
    margin-bottom: 18px;
    max-height: 220px;     /* ✅ if message is long, scroll inside content only */
    overflow: auto;
    padding-right: 6px;    /* ✅ avoids scrollbar overlay */

    p {
      font-size: 14px;
      line-height: 1.55;
      color: #555;
      margin: 0;
      white-space: pre-line; /* ✅ keeps \n in message */
      word-break: break-word;
    }
  }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;

    .cancel-btn {
      color: #555;
      padding: 0 16px;

      &:hover {
        background-color: rgba(123, 84, 47, 0.05);
      }
    }

    .confirm-btn {
      padding: 0 18px;
      height: 38px;
      border-radius: 18px;
      font-weight: 500;
    }
  }

  @media (max-width: 480px) {
    .confirm-dialog {
      max-width: 100%;
      padding: 18px;
    }

    .dialog-actions {
      flex-direction: column;

      .cancel-btn,
      .confirm-btn {
        width: 100%;
      }
    }
  }
`],
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

  isWarningAction(): boolean {
    const title = this.data.title.toLowerCase();
    return title.includes('delete') || title.includes('ban') || title.includes('remove');
  }

  getIcon(): string {
    if (this.isWarningAction()) {
      return 'warning';
    }
    return 'help_outline';
  }
}