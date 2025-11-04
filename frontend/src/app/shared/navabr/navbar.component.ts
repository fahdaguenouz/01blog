import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  isAuthPage = false;

  constructor(private router: Router, private auth: AuthService) {
    this.router.events.subscribe(() => {
      this.isAuthPage = this.router.url.startsWith('/auth');
    });
  }

  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }
}
