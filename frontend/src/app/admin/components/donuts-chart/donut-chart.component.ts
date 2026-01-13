import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-svg-donut-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './donut-chart.component.html',
  styleUrls: ['./donut-chart.component.scss'],
})
export class SvgDonutChartComponent implements OnChanges {
  @Input() title = 'Donut';
  @Input() labels: string[] = [];
  @Input() data: number[] = [];

  segments: { path: string; color: string; label: string; value: number }[] = [];
  total = 0;

  // Updated colors to match theme
  colors = [
    '#FF9D00', // Primary orange
    '#B6771D', // Secondary gold brown
    '#26a69a', // Teal
    '#66bb6a', // Green
    '#ef5350', // Red
    '#7e57c2', // Purple
    '#FFCF71', // Light accent
  ];

  ngOnChanges(changes: SimpleChanges) {
    this.buildSegments();
  }

  buildSegments() {
    if (!this.data?.length || !this.labels?.length) {
      this.segments = [];
      this.total = 0;
      return;
    }
    const values = this.data || [];
    const labels = this.labels || [];
    const total = values.reduce((s, v) => s + v, 0) || 0;
    this.total = total;
    let angle = -Math.PI / 2; // start at top
    this.segments = [];

    for (let i = 0; i < values.length; i++) {
      const v = values[i];
      const fraction = total ? v / total : 0;
      const nextAngle = angle + fraction * Math.PI * 2;
      const path = this.describeArc(0, 0, 60, (angle * 180) / Math.PI, (nextAngle * 180) / Math.PI);
      this.segments.push({
        path,
        color: this.colors[i % this.colors.length],
        label: labels[i] || `#${i + 1}`,
        value: v,
      });
      angle = nextAngle;
    }
  }

  describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const start = this.polarToCartesian(cx, cy, r, endAngle);
    const end = this.polarToCartesian(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
    const outer = [`M ${start.x} ${start.y}`, `A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`].join(
      ' '
    );
    const innerR = r - 24;
    const endInner = this.polarToCartesian(cx, cy, innerR, endAngle);
    const startInner = this.polarToCartesian(cx, cy, innerR, startAngle);
    const inner = [
      `L ${startInner.x} ${startInner.y}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 1 ${endInner.x} ${endInner.y}`,
      'Z',
    ].join(' ');
    return outer + inner;
  }

  polarToCartesian(cx: number, cy: number, r: number, angleInDegrees: number) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians),
    };
  }
}
