import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SECTOR_COMPASS_LABEL, SectorSummary } from '../../../../shared/models/seat.model';

@Component({
  selector: 'kte-sector-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgFor, NgIf, NgClass, MatCardModule, MatProgressBarModule],
  template: `
    <section class="kte-sector-summary" *ngIf="summaries.length > 0">
      <h3 class="kte-sector-summary__title">Szektorok foglaltsága</h3>
      <div class="kte-sector-summary__grid">
        <mat-card
          *ngFor="let summary of summaries; trackBy: trackBySection"
          class="kte-sector-card"
          [ngClass]="{
            'kte-sector-card--active': summary.section === selectedSection
          }"
          (click)="sectorSelected.emit(summary.section)"
          (keyup.enter)="sectorSelected.emit(summary.section)"
          tabindex="0"
          role="button"
          [attr.aria-pressed]="summary.section === selectedSection"
        >
          <header class="kte-sector-card__header">
            <span class="kte-sector-card__section">{{ summary.section }}</span>
            <span class="kte-sector-card__compass">{{ compassLabel(summary.section) }}</span>
          </header>

          <p class="kte-sector-card__numbers">
            <strong>{{ summary.available }}</strong>
            <span>szabad / {{ summary.total }}</span>
          </p>

          <mat-progress-bar
            mode="determinate"
            [value]="summary.occupancyRatio * 100"
            [color]="progressColor(summary.occupancyRatio)"
          ></mat-progress-bar>

          <footer class="kte-sector-card__legend">
            <span><span class="dot dot--locked"></span>{{ summary.locked }} foglalva</span>
            <span><span class="dot dot--sold"></span>{{ summary.sold }} elkelt</span>
          </footer>
        </mat-card>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .kte-sector-summary__title {
        margin: 0 0 12px;
        font-family: 'Barlow Condensed', 'Inter', sans-serif;
        font-size: 20px;
        font-weight: 700;
        color: var(--kte-color-primary);
        letter-spacing: -0.005em;
      }

      .kte-sector-summary__grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
      }

      .kte-sector-card {
        padding: 16px;
        border-radius: var(--kte-radius-md);
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        border: 2px solid transparent;
      }

      .kte-sector-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--kte-shadow-md);
      }

      .kte-sector-card--active {
        border-color: var(--kte-color-accent);
        box-shadow: 0 0 0 4px rgba(255, 201, 5, 0.18);
      }

      .kte-sector-card__header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 6px;
      }

      .kte-sector-card__section {
        font-family: 'Barlow Condensed', 'Inter', sans-serif;
        font-size: 24px;
        font-weight: 700;
        color: var(--kte-color-primary);
      }

      .kte-sector-card__compass {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: #6b7280;
      }

      .kte-sector-card__numbers {
        margin: 0 0 8px;
        display: flex;
        align-items: baseline;
        gap: 6px;
        color: #4b5563;
        font-size: 13px;
      }

      .kte-sector-card__numbers strong {
        font-family: 'Barlow Condensed', 'Inter', sans-serif;
        font-size: 22px;
        color: #15803d;
      }

      .kte-sector-card__legend {
        display: flex;
        justify-content: space-between;
        margin-top: 8px;
        font-size: 11px;
        color: #6b7280;

        span {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }

      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        display: inline-block;
      }

      .dot--locked {
        background: #fb923c;
      }

      .dot--sold {
        background: #9ca3af;
      }
    `,
  ],
})
export class SectorSummaryComponent {
  @Input() summaries: readonly SectorSummary[] = [];
  @Input() selectedSection: string | null = null;
  @Output() sectorSelected = new EventEmitter<string>();

  protected progressColor(ratio: number): 'primary' | 'accent' | 'warn' {
    if (ratio >= 0.85) {
      return 'warn';
    }
    if (ratio >= 0.5) {
      return 'accent';
    }
    return 'primary';
  }

  protected compassLabel(section: string): string {
    return SECTOR_COMPASS_LABEL[section] ?? section;
  }

  protected trackBySection(_index: number, item: SectorSummary): string {
    return item.section;
  }
}
