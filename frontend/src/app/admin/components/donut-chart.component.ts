import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-svg-donut-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card class="chart-card">
      <mat-card-header><mat-card-title>{{ title }}</mat-card-title></mat-card-header>
      <mat-card-content class="donut-content">
        <svg viewBox="0 0 200 200" class="donut-svg">
          <g transform="translate(100,100)">
            <circle r="60" fill="transparent"></circle>
            <ng-container *ngFor="let seg of segments">
              <path [attr.d]="seg.path" [attr.fill]="seg.color"></path>
            </ng-container>
            <!-- hole -->
            <circle r="36" fill="white"></circle>
            <text *ngIf="total" x="0" y="4" text-anchor="middle" font-size="14" fill="#333">{{ total }}</text>
          </g>
        </svg>

        <div class="legend">
          <div class="item" *ngFor="let seg of segments">
            <span class="swatch" [style.background]="seg.color"></span>
            <span class="lbl">{{seg.label}} ({{seg.value}})</span>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .donut-content{display:flex;gap:12px;align-items:center}
    .donut-svg{width:180px;height:180px}
    .legend{display:flex;flex-direction:column;gap:6px}
    .item{display:flex;align-items:center;gap:8px}
    .swatch{width:14px;height:14px;border-radius:3px;display:inline-block}
    .lbl{font-size:0.9rem}
  `]
})
export class SvgDonutChartComponent implements OnChanges {
  @Input() title = 'Donut';
  @Input() labels: string[] = [];
  @Input() data: number[] = [];

  segments: { path: string; color: string; label: string; value: number }[] = [];
  total = 0;
  colors = ['#1976d2','#26a69a','#ffb300','#ef5350','#7e57c2'];

  ngOnChanges(changes: SimpleChanges){
    this.buildSegments();
  }

  buildSegments(){
    const values = this.data || [];
    const labels = this.labels || [];
    const total = values.reduce((s,v)=>s+v,0) || 0;
    this.total = total;
    let angle = -Math.PI/2; // start at top
    this.segments = [];

    for (let i=0;i<values.length;i++){
      const v = values[i];
      const fraction = total ? v/total : 0;
      const nextAngle = angle + fraction * Math.PI * 2;
      const path = this.describeArc(0,0,60, angle*180/Math.PI, nextAngle*180/Math.PI);
      this.segments.push({ path, color: this.colors[i % this.colors.length], label: labels[i] || `#${i+1}`, value: v });
      angle = nextAngle;
    }
  }

  // returns path for donut segment (outer arc then inner arc back)
  describeArc(cx:number, cy:number, r:number, startAngle:number, endAngle:number){
    const start = this.polarToCartesian(cx, cy, r, endAngle);
    const end = this.polarToCartesian(cx, cy, r, startAngle);
    const largeArc = (endAngle - startAngle <= 180) ? "0" : "1";
    const outer = [`M ${start.x} ${start.y}`, `A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`].join(' ');
    const innerR = r - 24; // donut thickness
    const endInner = this.polarToCartesian(cx, cy, innerR, endAngle);
    const startInner = this.polarToCartesian(cx, cy, innerR, startAngle);
    const inner = [`L ${startInner.x} ${startInner.y}`, `A ${innerR} ${innerR} 0 ${largeArc} 1 ${endInner.x} ${endInner.y}`, 'Z'].join(' ');
    return outer + inner;
  }

  polarToCartesian(cx:number, cy:number, r:number, angleInDegrees:number){
    const angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
    return { x: cx + (r * Math.cos(angleInRadians)), y: cy + (r * Math.sin(angleInRadians)) };
  }
}
