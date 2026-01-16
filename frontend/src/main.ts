import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { App } from './app/app';
import { routes } from './app/app.routes';

import { authTokenInterceptor } from './app/core/auth-token.interceptor';
import { authErrorInterceptor } from './app/core/auth-error.interceptor';
import { httpErrorSnackInterceptor } from './app/core/http-error-snack.interceptor';

bootstrapApplication(App, {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideToastr(),
    provideHttpClient(
      withFetch(),
      withInterceptors([authTokenInterceptor, httpErrorSnackInterceptor, authErrorInterceptor])
    ),
  ],
}).catch(console.error);
