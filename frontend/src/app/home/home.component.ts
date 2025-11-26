// src/app/home/home.component.ts
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { GuestPostListComponent } from '../post/guest-post-list.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, MatButtonModule, GuestPostListComponent],
  templateUrl: `./home.component.html`,
  styleUrls: [`./home.component.css`]
})
export class Home {}
