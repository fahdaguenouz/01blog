// edit-profile-dialog.component.ts (COMPLETE & CORRECT)
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-edit-profile-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatCardModule,
  ],
  template: `
    <div class="dialog-wrapper">
      <mat-card class="edit-form-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>edit</mat-icon>
            Edit Profile
          </mat-card-title>
        </mat-card-header>

        <mat-card-content class="form-content">
          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
            <!-- Avatar Preview & Upload -->
            <div class="avatar-section">
              <div class="avatar-preview-container">
                <div
                  class="avatar-preview"
                  [ngStyle]="{
                    'background-image': previewUrl ? 'url(' + previewUrl + ')' : 'none'
                  }"
                >
                  <mat-icon *ngIf="!previewUrl">account_circle</mat-icon>
                  <input
                    type="file"
                    #avatarInput
                    id="avatar"
                    (change)="onFileSelected($event)"
                    accept="image/*"
                    class="file-input"
                  />
                </div>
                <label for="avatar" class="upload-label">
                  <mat-icon>cloud_upload</mat-icon>
                  Update photo
                </label>
              </div>
              <div *ngIf="selectedAvatarFile" class="file-info">
                {{ selectedAvatarFile.name }}
              </div>
            </div>

            <!-- Form Fields -->
            <div class="form-grid">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Name</mat-label>
                <input matInput formControlName="name" placeholder="Enter your name" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Age</mat-label>
                <input
                  matInput
                  type="number"
                  formControlName="age"
                  placeholder="Age"
                  min="13"
                  max="120"
                />
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field full-span">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" placeholder="your@email.com" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field full-span">
                <mat-label>Bio</mat-label>
                <textarea
                  matInput
                  formControlName="bio"
                  rows="4"
                  placeholder="Tell us about yourself..."
                ></textarea>
                <mat-hint>Max 500 characters</mat-hint>
              </mat-form-field>
            </div>

            <!-- Changed fields indicator -->
            <div *ngIf="changedCount > 0" class="changes-indicator">
              <mat-icon color="primary">info</mat-icon>
              <span>{{ changedCount }} field(s) will be updated</span>
            </div>
          </form>
        </mat-card-content>

        <mat-card-actions class="form-actions">
          <button mat-button type="button" (click)="onClose()" class="cancel-btn">Cancel</button>
          <button
            mat-raised-button
            color="primary"
            type="button"
            (click)="onSubmit()"
            [disabled]="changedCount === 0 && !selectedAvatarFile"
          >
            Update Profile
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-width: 480px;
        max-width: 520px;
      }

      .dialog-wrapper {
        padding: 32px;
        background: #ffffff;
      }

      .edit-form-card {
        border-radius: 16px;
        box-shadow: 0 8px 24px rgba(123, 84, 47, 0.2);
        overflow: hidden;
      }

      mat-card-header {
        padding: 32px 24px;
        background: linear-gradient(135deg, #ff9d00, #b6771d);
        color: #ffffff;

        mat-card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 20px;
          font-weight: 600;
          margin: 0;

          mat-icon {
            font-size: 24px;
            width: 24px;
            height: 24px;
          }
        }
      }

      .form-content {
        padding: 32px 24px;
      }

      .avatar-section {
        margin-bottom: 32px;
        text-align: center;
      }

      .avatar-preview-container {
        position: relative;
        display: inline-block;
        margin-bottom: 16px;
      }

      .avatar-preview {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background: linear-gradient(135deg, #ff9d00, #b6771d);
        background-size: cover;
        background-position: center;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 4px 12px rgba(123, 84, 47, 0.15);
        transition: all 0.3s ease;
        cursor: pointer;

        mat-icon {
          font-size: 56px;
          width: 56px;
          height: 56px;
          color: rgba(255, 255, 255, 0.9);
        }

        &:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 24px rgba(123, 84, 47, 0.2);
        }
      }

      .file-input {
        position: absolute;
        opacity: 0;
        width: 100%;
        height: 100%;
        cursor: pointer;
      }

      .upload-label {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #ff9d00;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        padding: 8px 16px;
        border-radius: 8px;
        border: 2px dashed rgba(255, 157, 0, 0.3);

        &:hover {
          background: rgba(255, 157, 0, 0.05);
          border-color: #ff9d00;
        }

        mat-icon {
          font-size: 20px;
        }
      }

      .file-info {
        font-size: 14px;
        color: #555555;
        background: #fff9f0;
        padding: 4px 8px;
        border-radius: 8px;
        margin-top: 8px;
      }

      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px 24px;
        margin-bottom: 24px;
      }

      .form-field {
        &.full-span {
          grid-column: 1 / -1;
        }
      }

      mat-form-field {
        width: 100%;

        ::ng-deep {
          .mat-mdc-form-field {
            background: transparent;
          }

          .mdc-text-field--outlined {
            .mdc-notched-outline__leading,
            .mdc-notched-outline__notch,
            .mdc-notched-outline__trailing {
              border-color: rgba(123, 84, 47, 0.2) !important;
            }

            &:hover .mdc-notched-outline__leading,
            &:hover .mdc-notched-outline__notch,
            &:hover .mdc-notched-outline__trailing {
              border-color: #ff9d00 !important;
            }

            &.mdc-text-field--focused .mdc-notched-outline__leading,
            &.mdc-text-field--focused .mdc-notched-outline__notch,
            &.mdc-text-field--focused .mdc-notched-outline__trailing {
              border-color: #ff9d00 !important;
            }
          }

          .mat-mdc-form-field-label {
            color: #7b542f;
          }

          .mdc-text-field--focused .mat-mdc-form-field-label {
            color: #ff9d00;
          }
        }
      }

      textarea {
        resize: vertical;
      }

      .changes-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 16px;
        background: rgba(255, 157, 0, 0.08);
        border-radius: 12px;
        border-left: 4px solid #ff9d00;
        margin-bottom: 24px;
      }

      .form-actions {
        padding: 24px;
        border-top: 1px solid rgba(123, 84, 47, 0.1);
        justify-content: flex-end;
        gap: 16px;
      }

      .cancel-btn {
        min-width: 100px;
      }

      @media (max-width: 520px) {
        .form-grid {
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .avatar-preview {
          width: 100px;
          height: 100px;

          mat-icon {
            font-size: 48px;
            width: 48px;
            height: 48px;
          }
        }
      }
      :host {
        display: block;
        min-width: 680px; 
        max-width: 760px;
        width: 90vw;
      }
    `,
  ],
})
export class EditProfileDialogComponent implements OnInit {
  form!: FormGroup;
  selectedAvatarFile: File | null = null;
  previewUrl: string | null = null;
  originalData: any = {};
  changedFields: Record<string, any> = {};

  constructor(
    public dialogRef: MatDialogRef<EditProfileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.originalData = { ...data };
    this.previewUrl = data.avatarUrl || null;
  }

  ngOnInit() {
    this.form = new FormGroup({
      name: new FormControl(this.originalData.name || '', []),
      email: new FormControl(this.originalData.email || '', []),
      bio: new FormControl(this.originalData.bio || '', []),
      age: new FormControl(this.originalData.age ?? '', []),
    });

    this.form.valueChanges.subscribe((value: any) => {
      this.changedFields = {};
      Object.keys(value).forEach((key: string) => {
        if (value[key] !== this.originalData[key]) {
          this.changedFields[key] = value[key];
        }
      });
    });
  }

  get changedCount(): number {
    return Object.keys(this.changedFields).length;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedAvatarFile = input.files[0];

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedAvatarFile);
    }
  }

  onClose() {
    this.dialogRef.close(null);
  }

  onSubmit() {
    const changes: Record<string, any> = {};
    Object.entries<any>(this.form.value).forEach(([key, value]: [string, any]) => {
      if (value !== this.originalData[key] && value !== null && value !== '') {
        changes[key] = value;
      }
    });

    if (Object.keys(changes).length === 0 && !this.selectedAvatarFile) {
      return;
    }

    this.dialogRef.close({
      changes,
      avatar: this.selectedAvatarFile,
    });
  }
}
