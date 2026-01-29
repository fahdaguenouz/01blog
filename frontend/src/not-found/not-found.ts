// not-found-redirect.component.ts
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SnackService } from '../app/core/snack.service';

@Component({
  standalone: true,
  template: '',
})
export class NotFoundRedirectComponent {
  private router = inject(Router);
  private snack = inject(SnackService);

  constructor() {
    this.snack.error('This route is not found');
    this.router.navigateByUrl('/');
  }
}
