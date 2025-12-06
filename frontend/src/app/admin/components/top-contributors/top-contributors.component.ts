// src/app/admin/components/top-contributors.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-top-contributors',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
   templateUrl: './top-contributors.component.html',
  styleUrls: ['./top-contributors.component.scss'],
})
export class TopContributorsComponent {
  @Input() items: any[] = [];
  cols = ['username','posts','flagged','last'];

  // view(u: any){ console.log('view', u) }
  // suspend(u: any){ console.log('suspend', u) }
}
