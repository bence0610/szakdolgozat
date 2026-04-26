import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'kte-stadium-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Stadion - Helyválasztás</mat-card-title>
        <mat-card-subtitle>Széktói Stadion, Kecskemét</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <p>
          Itt jelenik majd meg az interaktív lelátótérkép a következő iterációban,
          valós idejű foglaltsági állapottal és Redis-alapú székzárolással.
        </p>
      </mat-card-content>
    </mat-card>
  `,
})
export class StadiumPage {}
