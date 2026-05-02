import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoyaltyService } from '../../core/services/loyalty.service';
import { DiscountBreakdownComponent, DiscountBreakdown } from './components/discount-breakdown.component';

@Component({
  selector: 'kte-checkout-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, DiscountBreakdownComponent],
  template: `
    <section class="checkout">
      <mat-card class="checkout-card">
        <mat-card-header>
          <mat-card-title>Fizetés</mat-card-title>
          <mat-card-subtitle>Hűségszinted alapján kalkulált végösszeg</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (loading()) {
            <div class="loader"><mat-spinner diameter="40"></mat-spinner></div>
          } @else if (preview()) {
            <kte-discount-breakdown [breakdown]="preview()!"></kte-discount-breakdown>
          }
          <p class="hint">A kártyás fizetés véglegesítése a kosár-checkout flowban történik. A fenti számítás előnézetet ad a hűségkedvezményről.</p>
        </mat-card-content>
      </mat-card>
    </section>
  `,
  styles: [
    `
      .checkout { padding: 32px; max-width: 600px; margin: 0 auto; }
      .checkout-card { background: #1a1a1a; color: #f5f5f5; border: 1px solid #2e2e2e; }
      .loader { display: flex; justify-content: center; padding: 32px; }
      .hint { color: #777777; font-size: 13px; margin-top: 16px; }
    `,
  ],
})
export class CheckoutPage implements OnInit {
  protected readonly loading = signal<boolean>(true);
  protected readonly preview = signal<DiscountBreakdown | null>(null);

  private readonly loyaltyService = inject(LoyaltyService);

  ngOnInit(): void {
    // The actual cart total comes from cart state in a fuller implementation;
    // here we use a representative example so the discount card always renders.
    const exampleTotal = 12000; // HUF
    this.loyaltyService.getSnapshot().subscribe({
      next: (snapshot) => {
        const discountPercent = snapshot.tier.discountPercent;
        const discountAmount = Math.round((exampleTotal * discountPercent) / 100);
        this.preview.set({
          originalAmount: exampleTotal,
          discountAmount,
          discountPercent,
          amount: exampleTotal - discountAmount,
          currency: 'HUF',
          tier: snapshot.tier.tier,
        });
        this.loading.set(false);
      },
      error: () => {
        this.preview.set({
          originalAmount: exampleTotal,
          discountAmount: 0,
          discountPercent: 0,
          amount: exampleTotal,
          currency: 'HUF',
        });
        this.loading.set(false);
      },
    });
  }
}
