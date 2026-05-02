import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { TicketsService } from '../../core/services/tickets.service';
import { SeasonPassesService } from '../../core/services/season-passes.service';
import { TicketResponse } from '../../core/models/ticket.models';
import { SeasonPassResponse } from '../../core/models/season-pass.models';
import { TicketCardComponent } from './components/ticket-card.component';
import { SeasonPassCardComponent } from './components/season-pass-card.component';

@Component({
  selector: 'kte-profile-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    TicketCardComponent,
    SeasonPassCardComponent,
  ],
  template: `
    <section class="profile-page">
      <header class="page-header">
        <h1>Profil</h1>
        <a mat-stroked-button color="primary" routerLink="/loyalty">
          <mat-icon>star</mat-icon>
          Hűség dashboard
        </a>
      </header>

      <mat-tab-group dynamicHeight>
        <mat-tab label="Jegyek">
          @if (loadingTickets()) {
            <div class="loader"><mat-spinner diameter="40"></mat-spinner></div>
          } @else if (tickets().length === 0) {
            <p class="empty">Még nincs jegyed. Vásárolj egyet a kezdőlapról.</p>
          } @else {
            <div class="grid">
              @for (ticket of tickets(); track ticket.id) {
                <kte-ticket-card [ticket]="ticket"></kte-ticket-card>
              }
            </div>
          }
        </mat-tab>
        <mat-tab label="Bérletek">
          @if (loadingPasses()) {
            <div class="loader"><mat-spinner diameter="40"></mat-spinner></div>
          } @else if (passes().length === 0) {
            <p class="empty">Még nincs bérleted.</p>
          } @else {
            <div class="grid">
              @for (pass of passes(); track pass.id) {
                <kte-season-pass-card [pass]="pass" (changed)="reloadPasses()"></kte-season-pass-card>
              }
            </div>
          }
        </mat-tab>
      </mat-tab-group>
    </section>
  `,
  styles: [
    `
      .profile-page { display: block; padding: 24px; }
      .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
      .page-header h1 { margin: 0; font-size: 28px; color: #f5f5f5; }
      .grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); padding: 16px 0; }
      .empty { color: #777777; padding: 24px; text-align: center; }
      .loader { display: flex; justify-content: center; padding: 32px; }
    `,
  ],
})
export class ProfilePage implements OnInit {
  protected readonly tickets = signal<TicketResponse[]>([]);
  protected readonly passes = signal<SeasonPassResponse[]>([]);
  protected readonly loadingTickets = signal<boolean>(true);
  protected readonly loadingPasses = signal<boolean>(true);

  private readonly ticketsService = inject(TicketsService);
  private readonly passesService = inject(SeasonPassesService);

  ngOnInit(): void {
    this.reloadTickets();
    this.reloadPasses();
  }

  reloadTickets(): void {
    this.loadingTickets.set(true);
    this.ticketsService.listMine().subscribe({
      next: (tickets) => {
        this.tickets.set(tickets);
        this.loadingTickets.set(false);
      },
      error: () => {
        this.tickets.set([]);
        this.loadingTickets.set(false);
      },
    });
  }

  reloadPasses(): void {
    this.loadingPasses.set(true);
    this.passesService.listMine().subscribe({
      next: (passes) => {
        this.passes.set(passes);
        this.loadingPasses.set(false);
      },
      error: () => {
        this.passes.set([]);
        this.loadingPasses.set(false);
      },
    });
  }
}
