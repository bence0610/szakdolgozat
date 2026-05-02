import { Routes } from '@angular/router';
import { AdminPage } from './admin.page';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminPage,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'revenue',
      },
      {
        path: 'revenue',
        loadComponent: () =>
          import('./revenue/revenue-stats.page').then((m) => m.RevenueStatsPage),
        title: 'Admin - Bevételi statisztikák',
      },
      {
        path: 'heatmap',
        loadComponent: () =>
          import('./heatmap/seat-heatmap.page').then((m) => m.SeatHeatmapPage),
        title: 'Admin - Foglaltsági heatmap',
      },
    ],
  },
];
