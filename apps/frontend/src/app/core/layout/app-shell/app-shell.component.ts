import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { CartFacade } from '../../cart/cart.facade';

interface NavItem {
  readonly label: string;
  readonly route: string;
  readonly icon: string;
  readonly exact?: boolean;
  readonly authOnly?: boolean;
}

@Component({
  selector: 'kte-app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatMenuModule,
    MatSidenavModule,
    MatListModule,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  private readonly auth = inject(AuthService);
  private readonly cart = inject(CartFacade);

  protected readonly user = this.auth.user;
  protected readonly isAuthenticated = this.auth.isAuthenticated;
  protected readonly cartCount = this.cart.count;

  protected readonly navItems = signal<readonly NavItem[]>([
    { label: 'Kezdőlap', route: '/', icon: 'home', exact: true },
    { label: 'Stadion', route: '/stadium', icon: 'stadium' },
    { label: 'Kosár', route: '/cart', icon: 'shopping_cart' },
  ]);

  protected readonly visibleNavItems = computed(() =>
    this.navItems().filter((item) => !item.authOnly || this.isAuthenticated()),
  );

  protected readonly sidenavOpen = signal(false);
  protected readonly year = new Date().getFullYear();

  protected toggleSidenav(): void {
    this.sidenavOpen.update((value) => !value);
  }

  protected closeSidenav(): void {
    this.sidenavOpen.set(false);
  }

  protected logout(): void {
    this.auth.logout().subscribe();
  }

  protected userInitials(): string {
    const user = this.user();
    if (!user) {
      return '';
    }
    return `${(user.lastName[0] ?? '').toUpperCase()}${(user.firstName[0] ?? '').toUpperCase()}`;
  }
}
