import { Component, Input, HostListener, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-svg-line-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card class="chart-card">
      <mat-card-header><mat-card-title>{{ title }}</mat-card-title></mat-card-header>
      <mat-card-content class="chart-content">
        <svg [attr.viewBox]="viewBox" preserveAspectRatio="none" class="svg">
          <!-- grid lines -->
          <g *ngFor="let y of gridYs">
            <line [attr.x1]="0" [attr.x2]="width" [attr.y1]="y" [attr.y2]="y" stroke="rgba(0,0,0,0.06)"></line>
          </g>

          <!-- area fill -->
          <path *ngIf="path" [attr.d]="areaPath" fill="rgba(33,150,243,0.08)"></path>
          <!-- line -->
          <path *ngIf="path" [attr.d]="path" fill="none" stroke="rgba(33,150,243,0.9)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></path>

          <!-- points -->
          <g *ngFor="let p of points">
            <circle [attr.cx]="p.x" [attr.cy]="p.y" r="3" fill="white" stroke="rgba(33,150,243,1)"></circle>
          </g>
        </svg>

        <div class="labels" *ngIf="labels?.length">
          <div class="label-left">{{ minLabel }}</div>
          <div class="label-right">{{ maxLabel }}</div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .chart-card{padding:6px;height:100%}
    .chart-content{position:relative;height:260px;display:flex;flex-direction:column}
    .svg{width:100%;height:100%}
    .labels{display:flex;justify-content:space-between;font-size:0.85rem;margin-top:6px;color:rgba(0,0,0,0.6)}
  `]
})
export class SvgLineChartComponent implements OnChanges {
  @Input() title = 'Line';
  @Input() labels: string[] = [];
  @Input() data: number[] = [];

  width = 600;
  height = 260;
  padding = { left: 30, right: 12, top: 12, bottom: 30 };
  viewBox = `0 0 ${this.width} ${this.height}`;

  points: { x: number; y: number; v: number }[] = [];
  path = '';
  areaPath = '';
  gridYs: number[] = [];
  minLabel = '';
  maxLabel = '';

  ngOnChanges(changes: SimpleChanges){
    this.compute();
  }

  @HostListener('window:resize')
  onResize() { this.compute(); }

  compute(){
    // responsive width: element width unknown inside component; use fixed viewbox but scale visually
    const w = this.width - this.padding.left - this.padding.right;
    const h = this.height - this.padding.top - this.padding.bottom;
    if (!this.data?.length) { this.points = []; this.path = ''; this.areaPath = ''; this.gridYs = []; return; }

    const max = Math.max(...this.data);
    const min = Math.min(...this.data);
    const range = (max - min) || 1;

    const n = this.data.length;
    this.points = this.data.map((v,i) => {
      const x = this.padding.left + (i / Math.max(1, n - 1)) * w;
      const y = this.padding.top + h - ((v - min) / range) * h;
      return { x, y, v };
    });

    // create smooth-ish path using simple cubic bezier (approx)
    const pts = this.points;
    let d = '';
    for (let i = 0; i < pts.length; i++){
      const p = pts[i];
      if (i === 0) { d += `M ${p.x} ${p.y}`; continue; }
      const prev = pts[i-1];
      const cx = (prev.x + p.x) / 2;
      d += ` Q ${prev.x} ${prev.y} ${cx} ${(prev.y + p.y)/2}`;
      d += ` T ${p.x} ${p.y}`;
    }
    // fallback if too short
    if (!d) d = pts.map((p,i)=> i===0?`M ${p.x} ${p.y}`:`L ${p.x} ${p.y}`).join(' ');

    this.path = d;

    // area path (line down to bottom and close)
    const first = pts[0];
    const last = pts[pts.length - 1];
    this.areaPath = `${d} L ${last.x} ${this.padding.top + h} L ${first.x} ${this.padding.top + h} Z`;

    // grid lines y coordinates (4 rows)
    this.gridYs = [0,1,2,3].map(i => this.padding.top + (i/3)*h);

    this.minLabel = `${min}`;
    this.maxLabel = `${max}`;

    this.viewBox = `0 0 ${this.width} ${this.height}`;
  }
}
