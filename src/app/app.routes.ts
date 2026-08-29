import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'trips',
    pathMatch: 'full',
  },
  {
    path: 'trips',
    loadComponent: () =>
      import('./features/trips/containers/trip-list.container').then(
        m => m.TripListContainer
      ),
  },
  {
    path: 'trips/:id',
    loadComponent: () =>
      import('./features/trips/containers/trip-detail.container').then(
        m => m.TripDetailContainer
      ),
  },
  {
    path: '**',
    redirectTo: 'trips',
  },
];
