import { Routes } from '@angular/router';
import { AppShellComponent } from './core/layout/app-shell/app-shell.component';

export const APP_ROUTES: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/home/home.page').then((m) => m.HomePage),
        title: 'KTE Jegyportál - Kezdőlap',
      },
      {
        path: 'stadium',
        loadComponent: () =>
          import('./features/stadium/stadium.page').then((m) => m.StadiumPage),
        title: 'Stadion - Helyválasztás',
      },
      {
        path: 'cart',
        loadComponent: () =>
          import('./features/cart/cart.page').then((m) => m.CartPage),
        title: 'Kosár',
      },
      {
        path: 'checkout',
        loadComponent: () =>
          import('./features/checkout/checkout.page').then((m) => m.CheckoutPage),
        title: 'Fizetés',
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.page').then((m) => m.ProfilePage),
        title: 'Profil',
      },
      {
        path: 'loyalty',
        loadComponent: () =>
          import('./features/loyalty/loyalty-dashboard.page').then((m) => m.LoyaltyDashboardPage),
        title: 'Hűség Dashboard',
      },
      {
        path: 'admin',
        loadComponent: () =>
          import('./features/admin/admin.page').then((m) => m.AdminPage),
        title: 'Admin',
      },
      {
        path: '**',
        loadComponent: () =>
          import('./features/not-found/not-found.page').then((m) => m.NotFoundPage),
        title: '404 - Az oldal nem található',
      },
    ],
  },
];
