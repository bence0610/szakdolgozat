import { ChangeDetectionStrategy, Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TicketsService } from '../../../core/services/tickets.service';

export interface TicketQrDialogData {
  ticketId: string;
  matchTitle: string;
  seatLabel: string;
}

@Component({
  selector: 'kte-ticket-qr-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="qr-dialog">
      <h2 mat-dialog-title>{{ data.matchTitle }}</h2>
      <mat-dialog-content>
        <p class="seat">{{ data.seatLabel }}</p>
        @if (loading()) {
          <div class="loader">
            <mat-spinner diameter="48"></mat-spinner>
          </div>
        } @else if (error()) {
          <p class="error">{{ error() }}</p>
        } @else if (dataUrl()) {
          <img class="qr" [src]="dataUrl()" alt="QR kód" />
          <p class="hint">Mutasd be a beléptetésnél</p>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="dialogRef.close()">Bezárás</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .qr-dialog { color: #f5f5f5; }
      .qr { display: block; margin: 16px auto; width: 280px; height: 280px; background: #fff; border-radius: 12px; padding: 12px; }
      .seat { color: #aaaaaa; margin: 0 0 12px; }
      .hint { color: #aaaaaa; font-size: 13px; text-align: center; }
      .error { color: #ff6f6f; }
      .loader { display: flex; justify-content: center; padding: 32px 0; }
    `,
  ],
})
export class TicketQrDialogComponent {
  protected readonly loading = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);
  protected readonly dataUrl = signal<string | null>(null);

  private readonly ticketsService = inject(TicketsService);

  constructor(
    public readonly dialogRef: MatDialogRef<TicketQrDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: TicketQrDialogData,
  ) {
    this.ticketsService.getQr(data.ticketId).subscribe({
      next: (response) => {
        this.dataUrl.set(response.dataUrl);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('A QR kód betöltése sikertelen. Próbáld újra később.');
        this.loading.set(false);
      },
    });
  }
}
