import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-edit-profile-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Edit Profile</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()" mat-dialog-content>

      <mat-form-field appearance="fill" class="full-width">
        <mat-label>Name</mat-label>
        <input matInput formControlName="name" placeholder="Name" />
      </mat-form-field>

      <mat-form-field appearance="fill" class="full-width">
        <mat-label>Email</mat-label>
        <input matInput formControlName="email" placeholder="Email" />
      </mat-form-field>

      <mat-form-field appearance="fill" class="full-width">
        <mat-label>Bio</mat-label>
        <textarea matInput formControlName="bio" placeholder="Bio"></textarea>
      </mat-form-field>

      <mat-form-field appearance="fill" class="full-width">
        <mat-label>Age</mat-label>
        <input matInput type="number" formControlName="age" placeholder="Age" />
      </mat-form-field>

      <div class="avatar-upload">
        <label for="avatar">Update Avatar:</label>
        <input type="file" id="avatar" (change)="onFileSelected($event)" accept="image/*" />
      </div>

      <div class="buttons">
        <button mat-button type="button" (click)="onClose()">Cancel</button>
        <button mat-raised-button color="primary" type="submit">Update</button>
      </div>
    </form>
  `,
  styles: [
    `
      .full-width {
        width: 100%;
      }
      .buttons {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 16px;
      }
    `,
  ],
})
export class EditProfileDialogComponent {

  form: FormGroup;
  selectedAvatarFile: File | null = null;

  constructor(
    public dialogRef: MatDialogRef<EditProfileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = new FormGroup({
    
      name: new FormControl(data.name || ''),
      email: new FormControl(data.email || '', [Validators.email]),
      bio: new FormControl(data.bio || ''),
      age: new FormControl(data.age ?? null)
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.selectedAvatarFile = input.files[0];
    }
  }

  onClose() {
    this.dialogRef.close();
  }

  onSubmit() {
    if (this.form.invalid) return;

    const changes = Object.entries(this.form.value).reduce((acc, [key, value]) => {
      if (value !== this.data[key]) acc[key] = value;
      return acc;
    }, {} as any);

    if (!this.selectedAvatarFile && Object.keys(changes).length === 0) {
      alert('Nothing to update');
      return;
    }

    // Return both form changes and the selected avatar file
    this.dialogRef.close({ changes, avatar: this.selectedAvatarFile });
  }
}

