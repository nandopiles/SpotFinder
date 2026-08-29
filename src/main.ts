import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

async function prepareApp(): Promise<void> {
  if (typeof window !== 'undefined') {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
}

prepareApp().then(() => bootstrapApplication(AppComponent, appConfig));
