import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { interval } from 'rxjs';
import { filter, map, withLatestFrom } from 'rxjs/operators';
import { CartActions } from './cart.actions';
import { getExpiredSeatIds } from './cart.reducer';
import { selectCartItems } from './cart.selectors';

const TICK_INTERVAL_MS = 1_000;

interface ExpirationCheck {
  readonly now: number;
  readonly expiredIds: readonly string[];
}

/**
 * Drives the per-second cart countdown and dispatches `expireItems` when
 * lock TTLs run out so the reducer can drop the affected rows.
 */
@Injectable()
export class CartEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);

  cartTimer$ = createEffect(() =>
    interval(TICK_INTERVAL_MS).pipe(map(() => CartActions.tick({ now: Date.now() }))),
  );

  expireOnTick$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.tick),
      withLatestFrom(this.store.select(selectCartItems)),
      map(
        ([{ now }, items]): ExpirationCheck => ({
          now,
          expiredIds: getExpiredSeatIds(items, now),
        }),
      ),
      filter((check) => check.expiredIds.length > 0),
      map((check) => CartActions.expireItems({ seatIds: check.expiredIds })),
    ),
  );
}
