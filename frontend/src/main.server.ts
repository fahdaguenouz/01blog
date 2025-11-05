import 'zone.js';
import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { provideZoneChangeDetection } from '@angular/core';

const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(App, 
    {
      providers: [
        provideZoneChangeDetection(),
        provideRouter(routes),
        provideAnimations(),
        provideToastr(),
        provideHttpClient(withFetch())
      ]
    }, 
    context
  );

export default bootstrap;
