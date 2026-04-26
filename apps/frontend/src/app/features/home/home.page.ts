import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import {
  MatchesActions,
  selectAllMatches,
  selectMatchesError,
  selectMatchesLoading,
  selectNextMatch,
} from '../../state/matches';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { MatchCountdownComponent } from './components/match-countdown/match-countdown.component';
import { MatchListComponent } from './components/match-list/match-list.component';

@Component({
  selector: 'kte-home-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    HeroSectionComponent,
    MatchCountdownComponent,
    MatchListComponent,
  ],
  template: `
    <div class="kte-home">
      <kte-hero-section></kte-hero-section>

      <kte-match-countdown [match]="(nextMatch$ | async) ?? null"></kte-match-countdown>

      <kte-match-list
        [matches]="(matches$ | async) ?? []"
        [loading]="(loading$ | async) ?? false"
        [error]="(error$ | async) ?? null"
      ></kte-match-list>
    </div>
  `,
  styles: [
    `
      .kte-home {
        display: flex;
        flex-direction: column;
        gap: var(--kte-spacing-8);
      }
    `,
  ],
})
export class HomePage implements OnInit {
  private readonly store = inject(Store);

  protected readonly matches$ = this.store.select(selectAllMatches);
  protected readonly loading$ = this.store.select(selectMatchesLoading);
  protected readonly error$ = this.store.select(selectMatchesError);
  protected readonly nextMatch$ = this.store.select(selectNextMatch);

  ngOnInit(): void {
    this.store.dispatch(MatchesActions.loadMatches());
    this.store.dispatch(MatchesActions.loadUpcoming());
  }
}
