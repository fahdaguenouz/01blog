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
      padding: 24px;
      min-width: 400px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;

      .dialog-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: $primary-color;

        &.warning {
          color: #e74c3c;
        }
      }

      .dialog-title {
        font-size: 22px;
        font-weight: 600;
        color: #333333;
        margin: 0;
      }
    }

    .dialog-content {
      margin-bottom: 24px;

      p {
        font-size: 15px;
        line-height: 1.6;
        color: #555555;
        margin: 0;
      }
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;

      .cancel-btn {
        color: #555555;
        padding: 0 20px;

        &:hover {
          background-color: rgba(123, 84, 47, 0.05);
        }
      }

      .confirm-btn {
        padding: 0 24px;
        height: 40px;
        border-radius: 20px;
        font-weight: 500;
      }
    }

    @media (max-width: 480px) {
      .confirm-dialog {
        min-width: auto;
        width: 100%;
        padding: 20px;
      }

      .dialog-header {
        .dialog-title {
          font-size: 20px;
        }
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