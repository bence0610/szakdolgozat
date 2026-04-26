import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';

interface NavItem {
  readonly label: string;
  readonly route: string;
  readonly icon: string;
  readonly exact?: boolean;
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
    MatSidenavModule,
    MatListModule,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  protected readonly navItems = signal<readonly NavItem[]>([
    { label: 'Kezdőlap', route: '/', icon: 'home', exact: true },
    { label: 'Stadion', route: '/stadium', icon: 'stadium' },
    { label: 'Kosár', route: '/cart', icon: 'shopping_cart' },
    { label: 'Profil', route: '/profile', icon: 'person' },
    { label: 'Admin', route: '/admin', icon: 'shield' },
  ]);

  protected readonly sidenavOpen = signal(false);
  protected readonly year = new Date().getFullYear();

  protected toggleSidenav(): void {
    this.sidenavOpen.update((value) => !value);
  }

  protected closeSidenav(): void {
    this.sidenavOpen.set(false);
  }
}
