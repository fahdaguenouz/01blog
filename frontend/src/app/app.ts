import { Component } from '@angular/core';
import { NavbarComponent } from './shared/navabr/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  imports: [NavbarComponent],
})
export class App {}
