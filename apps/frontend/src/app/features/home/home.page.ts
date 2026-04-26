import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'kte-home-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <section class="kte-home">
      <header class="kte-home__hero">
        <h1>Üdv a KTE Jegyportálon</h1>
        <p>Vásárolj jegyet, intézd a bérleted, és kövesd kedvenc csapatod meccseit.</p>
        <a mat-flat-button color="accent" routerLink="/stadium">
          <mat-icon>event_seat</mat-icon>
          Helyválasztás
        </a>
      </header>

      <div class="kte-home__cards">
        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>sports_soccer</mat-icon>
            <mat-card-title>Aktuális meccsek</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>NB1 hazai mérkőzések a Széktói Stadionban.</p>
          </mat-card-content>
          <mat-card-actions>
            <a mat-button routerLink="/stadium">Megnyitás</a>
          </mat-card-actions>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>card_membership</mat-icon>
            <mat-card-title>Bérletek</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Szezonbérlet, hűségpontok, kölcsönzés barátoknak.</p>
          </mat-card-content>
          <mat-card-actions>
            <a mat-button routerLink="/profile">Profil</a>
          </mat-card-actions>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>support_agent</mat-icon>
            <mat-card-title>Segítség</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>AI-asszisztens (Claude) segít minden kérdésedben.</p>
          </mat-card-content>
        </mat-card>
      </div>
    </section>
  `,
  styles: [
    `
      .kte-home {
        display: flex;
        flex-direction: column;
        gap: var(--kte-spacing-8);
      }

      .kte-home__hero {
        background: linear-gradient(135deg, var(--kte-color-primary), #052545);
        color: #fff;
        padding: 48px 32px;
        border-radius: var(--kte-radius-lg);
        box-shadow: var(--kte-shadow-md);

        h1 {
          font-size: 32px;
          margin: 0 0 12px;
        }

        p {
          margin: 0 0 24px;
          opacity: 0.9;
        }
      }

      .kte-home__cards {
        display: grid;
        gap: var(--kte-spacing-6);
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      }

      mat-card {
        border-radius: var(--kte-radius-lg);
      }
    `,
  ],
})
export class HomePage {}
