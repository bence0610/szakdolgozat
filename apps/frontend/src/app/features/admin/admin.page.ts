import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'kte-admin-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Admin felület</mat-card-title>
        <mat-card-subtitle>Csak adminisztrátoroknak</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <p>A teljes admin panel a 4. iterációban készül el (mérkőzéskezelés, riportok, pénzügyek).</p>
      </mat-card-content>
    </mat-card>
  `,
})
export class AdminPage {}
