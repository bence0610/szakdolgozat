import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'kte-cart-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Kosár</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>A kosár jelenleg üres. A kiválasztott jegyek itt jelennek majd meg.</p>
      </mat-card-content>
    </mat-card>
  `,
})
export class CartPage {}
