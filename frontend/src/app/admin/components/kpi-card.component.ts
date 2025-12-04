import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card class="kpi-card mat-elevation-z2">
      <div class="top">
        <div class="value">{{ value | number }}</div>
        <div class="label">{{ label }}</div>
      </div>
      <div class="sub" *ngIf="sub">{{ sub }}</div>
      <div class="delta" *ngIf="delta !== undefined">
        <span [class.up]="delta >= 0" [class.down]="delta < 0">
          {{ delta >= 0 ? '+' : ''}}{{ delta }}%
        </span>
      </div>
    </mat-card>
  `,
  styles: [`
    .kpi-card{width:220px;padding:12px;display:flex;flex-direction:column;gap:6px}
    .value{font-size:1.6rem;font-weight:700}
    .label{color:rgba(0,0,0,0.6);font-size:.9rem}
    .sub{font-size:.85rem;color:rgba(0,0,0,0.55)}
    .delta{margin-top:auto;font-size:.85rem}
    .up{color:#2e7d32}.down{color:#c62828}
  `]
})
export class KpiCardComponent {
  @Input() label = '';
  @Input() value: number | null = 0;
  @Input() sub?: string;
  @Input() delta?: number;
}
