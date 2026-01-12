import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './kpi-card.component.html',
  styleUrls: ['./kpi-card.component.scss'],
})
export class KpiCardComponent {
  @Input() label = '';
  @Input() value: number | null = 0;
  @Input() sub?: string;
  @Input() delta?: number;

  getIcon(): string {
    const label = this.label.toLowerCase();
    if (label.includes('user')) return 'people';
    if (label.includes('post')) return 'article';

    if (label.includes('categor')) return 'category';
    return 'analytics';
  }
}