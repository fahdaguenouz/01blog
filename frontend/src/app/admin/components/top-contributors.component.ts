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
  template: `
    <mat-card>
      <mat-card-header><mat-card-title>Top Contributors</mat-card-title></mat-card-header>
      <mat-card-content>
        <table mat-table [dataSource]="items" class="mat-elevation-z1" style="width:100%">
          <!-- columns omitted for brevity — keep the same as before -->
          <ng-container matColumnDef="username"><th mat-header-cell *matHeaderCellDef> Username </th><td mat-cell *matCellDef="let e">{{e.username}}</td></ng-container>
          <ng-container matColumnDef="posts"><th mat-header-cell *matHeaderCellDef> Posts </th><td mat-cell *matCellDef="let e">{{e.postsCount}}</td></ng-container>
          <ng-container matColumnDef="flagged"><th mat-header-cell *matHeaderCellDef> Flagged </th><td mat-cell *matCellDef="let e"><mat-chip [color]="e.flaggedCount? 'warn': ''">{{ e.flaggedCount }}</mat-chip></td></ng-container>
          <ng-container matColumnDef="last"><th mat-header-cell *matHeaderCellDef> Last activity </th><td mat-cell *matCellDef="let e">{{ e.lastActivity | date:'short' }}</td></ng-container>
          <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let e"><button mat-icon-button (click)="view(e)"><mat-icon>visibility</mat-icon></button><button mat-icon-button color="warn" (click)="suspend(e)"><mat-icon>block</mat-icon></button></td></ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;"></tr>
        </table>
      </mat-card-content>
    </mat-card>
  `
})
export class TopContributorsComponent {
  @Input() items: any[] = [];
  cols = ['username','posts','flagged','last','actions'];

  view(u: any){ console.log('view', u) }
  suspend(u: any){ console.log('suspend', u) }
}
