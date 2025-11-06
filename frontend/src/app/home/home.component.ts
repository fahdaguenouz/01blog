// src/app/home/home.component.ts
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { GuestPostListComponent } from '../post/guest-post-list.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, MatButtonModule, GuestPostListComponent],
  template: `
    <div class="home-container">
      <div class="hero-section">
        <h1>Welcome to 01Blog</h1>
        <p>Share your learning journey with the community</p>
        <div class="cta-buttons">
          <a mat-raised-button color="primary" routerLink="/auth/login">Login</a>
          <a mat-raised-button color="accent" routerLink="/auth/signup">Sign Up</a>
        </div>
      </div>

      <div class="features-section">
        <h2>Latest posts</h2>
        <app-guest-post-list></app-guest-post-list>
      </div>
    </div>
  `,
  styles: [`
    .home-container { padding: 40px 20px; max-width: 1200px; margin: 0 auto; }
    .hero-section { text-align: center; padding: 60px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white; margin-bottom: 60px; }
    .hero-section h1 { font-size: 2.5rem; margin: 0 0 16px; }
    .hero-section p { font-size: 1.2rem; margin: 0 0 32px; opacity: 0.9; }
    .cta-buttons { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
    .features-section h2 { font-size: 2rem; margin: 40px 0 24px; text-align: center; }
    @media (max-width: 768px) {
      .hero-section h1 { font-size: 1.8rem; }
      .hero-section p { font-size: 1rem; }
      .cta-buttons { flex-direction: column; }
      .cta-buttons a { width: 100%; }
    }
  `]
})
export class Home {}
