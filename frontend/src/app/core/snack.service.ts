
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class SnackService {
  constructor(private snack: MatSnackBar) {}

  success(message: string) {
    this.snack.open(message, 'OK', {
      duration: 3000,
      panelClass: ['snack-success'],
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  error(message: string) {
    this.snack.open(message, 'Dismiss', {
      duration: 5000,
      panelClass: ['snack-error'],
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  info(message: string) {
    this.snack.open(message, 'OK', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
