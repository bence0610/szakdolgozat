import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'kte-checkout-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Fizetés</mat-card-title>
        <mat-card-subtitle>Stripe Elements integráció (Iteration 2)</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <p>A biztonságos kártyás fizetés a következő iterációban kerül implementálásra.</p>
      </mat-card-content>
    </mat-card>
  `,
})
export class CheckoutPage {}
