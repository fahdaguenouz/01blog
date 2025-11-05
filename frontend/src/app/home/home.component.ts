import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, MatButtonModule],
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
        <h2>Why 01Blog?</h2>
        <div class="features-grid">
          <div class="feature-card">
            <h3>📝 Share</h3>
            <p>Document your learning progress with rich blog posts</p>
          </div>
          <div class="feature-card">
            <h3>🤝 Connect</h3>
            <p>Subscribe to other students and engage with their content</p>
          </div>
          <div class="feature-card">
            <h3>💬 Discuss</h3>
            <p>Like and comment on posts to support your peers</p>
          </div>
          <div class="feature-card">
            <h3>🛡️ Safe</h3>
            <p>Community moderation keeps our platform positive and respectful</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      padding: 40px 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .hero-section {
      text-align: center;
      padding: 60px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      color: white;
      margin-bottom: 60px;

      h1 {
        font-size: 2.5rem;
        margin: 0 0 16px 0;
      }

      p {
        font-size: 1.2rem;
        margin: 0 0 32px 0;
        opacity: 0.9;
      }
    }

    .cta-buttons {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .features-section {
      h2 {
        font-size: 2rem;
        margin-bottom: 40px;
        text-align: center;
      }
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
    }

    .feature-card {
      padding: 24px;
      border: 1px solid #eee;
      border-radius: 12px;
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        transform: translateY(-4px);
      }

      h3 {
        margin: 0 0 12px 0;
        font-size: 1.3rem;
      }

      p {
        margin: 0;
        color: #666;
      }
    }

    @media (max-width: 768px) {
      .hero-section h1 {
        font-size: 1.8rem;
      }

      .hero-section p {
        font-size: 1rem;
      }

      .cta-buttons {
        flex-direction: column;

        a {
          width: 100%;
        }
      }
    }
  `]
})
export class Home {}
