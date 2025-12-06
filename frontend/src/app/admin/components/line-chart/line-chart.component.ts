// src/app/admin/components/line-chart.component.ts
import {
  Component,
  Input,
  HostListener,
  OnChanges,
  SimpleChanges,
  ElementRef,
  AfterViewInit,
  ViewEncapsulation,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-svg-line-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss'],
})
export class SvgLineChartComponent implements OnChanges, AfterViewInit {
  @Input() title = 'Line';
  @Input() labels: string[] = [];
  @Input() data: number[] = [];

  // svg geometry
  width = 700;
  height = 300;
  padding = { left: 48, right: 16, top: 16, bottom: 44 };

  viewBox = `0 0 ${this.width} ${this.height}`;

  // rendering
  points: { x: number; y: number; v: number; label?: string }[] = [];
  path = '';
  areaPath = '';
  gridYs: number[] = [];
  yTicks: { y: number; v: number }[] = [];
  xTicks: { x: number; label: string }[] = [];
  minLabel = '';
  maxLabel = '';
  avgLabel = '';

  // tooltip & hover
  tooltip: { v: number | string; label?: string } | null = null;
  tooltipVisible = false;
  tooltipTransform = 'translate(-50%, -120%)';
  hover: { x?: number } = {};

  // zoom (simple scale on x)
  zoom = 1;
  maxZoom = 3;
  minZoom = 1;

  // element reference for responsive width
  private el!: HTMLElement;

  constructor(private host: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    this.el = this.host.nativeElement;
    this.compute();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.compute();
  }

  @HostListener('window:resize')
  onResize() {
    this.compute();
  }

  // zoom helpers
  zoomIn() {
    this.zoom = Math.min(this.maxZoom, this.zoom + 0.25);
    this.compute();
  }
  zoomOut() {
    this.zoom = Math.max(this.minZoom, this.zoom - 0.25);
    this.compute();
  }
  resetZoom() {
    this.zoom = 1;
    this.compute();
  }

  compute() {
    const containerWidth = this.el?.getBoundingClientRect?.().width || this.width;
    this.width = Math.max(300, Math.min(1200, Math.round(containerWidth)));
    this.viewBox = `0 0 ${this.width} ${this.height}`;

    const w = (this.width - this.padding.left - this.padding.right) / this.zoom;
    const h = this.height - this.padding.top - this.padding.bottom;

    if (!this.data?.length) {
      this.points = [];
      this.path = '';
      this.areaPath = '';
      this.gridYs = [];
      this.yTicks = [];
      this.xTicks = [];
      this.minLabel = this.maxLabel = this.avgLabel = '';
      return;
    }

    const max = Math.max(...this.data);
    const min = Math.min(...this.data);
    const range = max - min || 1;

    const n = this.data.length;
    this.points = this.data.map((v, i) => {
      const x = this.padding.left + (i / Math.max(1, n - 1)) * w;
      const y = this.padding.top + h - ((v - min) / range) * h;
      return { x, y, v, label: this.labels?.[i] ?? '' };
    });

    // simple polyline path to avoid overshoot
    this.path = this.makeLinearPath(this.points);

    const first = this.points[0];
    const last = this.points[this.points.length - 1];
    this.areaPath = `${this.path} L ${last.x} ${this.padding.top + h} L ${first.x} ${
      this.padding.top + h
    } Z`;

    // grid lines
    this.gridYs = [0, 1, 2, 3, 4].map((i) => this.padding.top + (i / 4) * h);

    // Y ticks (nice numbers)
    const ticks = 4;
    const step = this.niceNumber(range / ticks);
    const yMin = Math.floor(min / step) * step;
    const yMax = Math.ceil(max / step) * step;
    const yVals: number[] = [];
    for (let v = yMin; v <= yMax + 1e-6; v += step) {
      yVals.push(Math.round((v + Number.EPSILON) * 100) / 100);
    }
    this.yTicks = yVals.map((v) => {
      const y = this.padding.top + h - ((v - yMin) / (yMax - yMin || 1)) * h;
      return { y, v };
    });

    // X ticks: up to 6 labels
    const maxLabels = Math.min(6, n);
    const stepX = Math.max(1, Math.floor((n - 1) / (maxLabels - 1 || 1)));
    this.xTicks = [];
    for (let i = 0; i < n; i += stepX) {
      const p = this.points[i];
      if (p) {
        this.xTicks.push({
          x: p.x,
          label: this.shortenLabel(this.labels?.[i] ?? '', 10),
        });
      }
    }
    const lastIndex = n - 1;
    if (!this.xTicks.find((t) => t.x === this.points[lastIndex].x)) {
      const p = this.points[lastIndex];
      this.xTicks.push({
        x: p.x,
        label: this.shortenLabel(this.labels?.[lastIndex] ?? '', 10),
      });
    }

    // summary labels
    this.minLabel = String(min);
    this.maxLabel = String(max);
    const avg = this.data.reduce((s, x) => s + x, 0) / this.data.length;
    this.avgLabel = `${Math.round(avg * 100) / 100}`;

    this.viewBox = `0 0 ${this.width} ${this.height}`;
  }

  onMouseMove(ev: MouseEvent) {
    const svgEl = ev.currentTarget as SVGElement;
    const svgRect = svgEl.getBoundingClientRect();
    if (!svgRect.width || !svgRect.height) return;

    // mouse position in CSS pixels relative to SVG top-left
    const cssX = ev.clientX - svgRect.left;
    const cssY = ev.clientY - svgRect.top;

    // map CSS pixels => SVG viewBox coordinates
    const svgX = (cssX / svgRect.width) * this.width;
    const svgY = (cssY / svgRect.height) * this.height;

    // store hover position in SVG coords (used to draw guide line)
    this.hover.x = svgX;

    // Find nearest point in SVG coordinate space
    let nearest: { x: number; y: number; v: number; label?: string } | null = null;
    let bestDist = Infinity;
    for (const p of this.points) {
      const d = Math.hypot(p.x - svgX, p.y - svgY);
      if (d < bestDist) {
        bestDist = d;
        nearest = p;
      }
    }

    // threshold in CSS px (how close the mouse must be), convert to SVG units
    const cssThreshold = 40; // you can tune this (in CSS pixels)
    const svgThreshold = (cssThreshold / svgRect.width) * this.width;

    if (nearest && bestDist <= svgThreshold) {
      this.tooltip = { v: nearest.v, label: nearest.label };
      this.tooltipVisible = true;

      // compute tooltip position in CSS pixels (so DOM tooltip lines up with visual point)
      const leftPx = (nearest.x / this.width) * svgRect.width;
      const topPx = (nearest.y / this.height) * svgRect.height;

      // tooltip element has left:0;top:0 and is moved with transform translate(px,px)
      this.tooltipTransform = `translate(${leftPx}px, ${topPx - 12}px)`; // raise tooltip a bit
    } else {
      this.tooltipVisible = false;
      this.tooltip = null;
    }
  }

  onPointEnter(p: { x: number; y: number; v: number; label?: string }) {
    // If the user hovered directly on the point (SVG event), position tooltip correctly.
    this.tooltip = { v: p.v, label: p.label };
    this.tooltipVisible = true;

    // Convert the point's SVG coords to CSS pixels for tooltip DOM placement
    // We need the SVG element size — try to find it from host element
    const svgEl = this.host.nativeElement.querySelector('svg') as SVGElement | null;
    if (svgEl) {
      const svgRect = svgEl.getBoundingClientRect();
      if (svgRect.width && svgRect.height) {
        const leftPx = (p.x / this.width) * svgRect.width;
        const topPx = (p.y / this.height) * svgRect.height;
        this.tooltipTransform = `translate(${leftPx}px, ${topPx - 12}px)`;
        // set hover x for guide line (SVG coords)
        this.hover.x = p.x;
        return;
      }
    }

    // fallback if we couldn't compute rect
    this.tooltipTransform = `translate(${p.x}px, ${p.y - 12}px)`;
    this.hover.x = p.x;
  }

  onLeave() {
    this.hover = {};
    this.tooltipVisible = false;
    this.tooltip = null;
  }


  // straight line segments between points
  private makeLinearPath(pts: { x: number; y: number }[]) {
    if (!pts.length) return '';
    const first = pts[0];
    const commands = [`M ${first.x} ${first.y}`];
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i];
      commands.push(`L ${p.x} ${p.y}`);
    }
    return commands.join(' ');
  }

  // nice 1‑2‑5 tick rounding
  private niceNumber(range: number) {
    const exponent = Math.floor(Math.log10(range));
    const fraction = range / Math.pow(10, exponent);
    let niceFraction;
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
    return niceFraction * Math.pow(10, exponent);
  }

  private shortenLabel(l: string, maxLen = 8) {
    if (!l) return '';
    return l.length <= maxLen ? l : l.slice(0, maxLen - 1) + '…';
  }
}
