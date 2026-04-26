import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  LockSeatResponse,
  MatchSeatsResponse,
  SeatStatus,
} from '../../shared/models/seat.model';

export const SeatsActions = createActionGroup({
  source: 'Seats',
  events: {
    'Load Seats For Match': props<{ matchId: string }>(),
    'Load Seats Success': props<{ response: MatchSeatsResponse }>(),
    'Load Seats Failure': props<{ error: string }>(),

    'Set Selected Sector': props<{ section: string | null }>(),
    'Set Selected Seat': props<{ seat: SeatStatus | null }>(),

    'Toggle Accessibility Filter': emptyProps(),

    'Lock Seat': props<{ matchId: string; seatId: string }>(),
    'Lock Seat Success': props<{ lock: LockSeatResponse }>(),
    'Lock Seat Failure': props<{ error: string; conflict: boolean; seatId: string }>(),

    'Unlock Seat': props<{ matchId: string; seatId: string; ownerToken: string }>(),
    'Unlock Seat Success': props<{ seatId: string }>(),
    'Unlock Seat Failure': props<{ error: string }>(),

    'Lock Countdown Tick': props<{ now: number }>(),
    'Clear Active Lock': emptyProps(),
  },
});
