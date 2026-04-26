import { inject, Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { SeatsApiService } from '../../shared/services/seats.api.service';
import { SeatsActions } from './seats.actions';

@Injectable()
export class SeatsEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(SeatsApiService);

  loadSeats$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SeatsActions.loadSeatsForMatch),
      switchMap(({ matchId }) =>
        this.api.loadSeats(matchId).pipe(
          map((response) => SeatsActions.loadSeatsSuccess({ response })),
          catchError((error: unknown) =>
            of(
              SeatsActions.loadSeatsFailure({
                error: this.toMessage(error, 'Nem sikerült betölteni az ülésrendet.'),
              }),
            ),
          ),
        ),
      ),
    ),
  );

  lockSeat$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SeatsActions.lockSeat),
      switchMap(({ matchId, seatId }) =>
        this.api.lockSeat(matchId, seatId).pipe(
          map((lock) => SeatsActions.lockSeatSuccess({ lock })),
          catchError((error: unknown) => {
            const conflict = error instanceof HttpErrorResponse && error.status === 409;
            const message = conflict
              ? 'Ez a szék már foglalt. Válassz másikat.'
              : this.toMessage(error, 'A szék zárolása sikertelen.');
            return of(
              SeatsActions.lockSeatFailure({ error: message, conflict, seatId }),
            );
          }),
        ),
      ),
    ),
  );

  unlockSeat$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SeatsActions.unlockSeat),
      switchMap(({ matchId, seatId, ownerToken }) =>
        this.api.unlockSeat(matchId, seatId, ownerToken).pipe(
          map(() => SeatsActions.unlockSeatSuccess({ seatId })),
          catchError((error: unknown) =>
            of(
              SeatsActions.unlockSeatFailure({
                error: this.toMessage(error, 'A szék feloldása sikertelen.'),
              }),
            ),
          ),
        ),
      ),
    ),
  );

  private toMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error;
      if (body && typeof body === 'object' && 'message' in body) {
        const value = (body as { message: unknown }).message;
        if (typeof value === 'string') {
          return value;
        }
        if (Array.isArray(value) && typeof value[0] === 'string') {
          return value[0];
        }
      }
      return error.message || fallback;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return fallback;
  }
}
