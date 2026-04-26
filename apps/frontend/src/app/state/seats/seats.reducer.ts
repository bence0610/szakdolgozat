import { createReducer, on } from '@ngrx/store';
import {
  LockSeatResponse,
  MatchSeatsResponse,
  SeatStatus,
  SectorSummary,
} from '../../shared/models/seat.model';
import { SeatsActions } from './seats.actions';

export interface SeatsState {
  readonly matchId: string | null;
  readonly seats: readonly SeatStatus[];
  readonly sectorSummary: readonly SectorSummary[];
  readonly selectedSection: string | null;
  readonly selectedSeat: SeatStatus | null;
  readonly accessibleOnly: boolean;
  readonly loading: boolean;
  readonly error: string | null;
  readonly activeLock: LockSeatResponse | null;
  readonly lockExpiresAtMs: number | null;
  readonly locking: boolean;
}

export const initialSeatsState: SeatsState = {
  matchId: null,
  seats: [],
  sectorSummary: [],
  selectedSection: null,
  selectedSeat: null,
  accessibleOnly: false,
  loading: false,
  error: null,
  activeLock: null,
  lockExpiresAtMs: null,
  locking: false,
};

const applyResponse = (
  state: SeatsState,
  response: MatchSeatsResponse,
): SeatsState => ({
  ...state,
  matchId: response.matchId,
  seats: response.seats,
  sectorSummary: response.sectorSummary,
  loading: false,
  error: null,
});

export const seatsReducer = createReducer(
  initialSeatsState,
  on(SeatsActions.loadSeatsForMatch, (state, { matchId }) => ({
    ...state,
    matchId,
    loading: true,
    error: null,
  })),
  on(SeatsActions.loadSeatsSuccess, (state, { response }) => applyResponse(state, response)),
  on(SeatsActions.loadSeatsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(SeatsActions.setSelectedSector, (state, { section }) => ({
    ...state,
    selectedSection: section,
    selectedSeat: section === null ? null : state.selectedSeat,
  })),
  on(SeatsActions.setSelectedSeat, (state, { seat }) => ({
    ...state,
    selectedSeat: seat,
  })),
  on(SeatsActions.toggleAccessibilityFilter, (state) => ({
    ...state,
    accessibleOnly: !state.accessibleOnly,
  })),
  on(SeatsActions.lockSeat, (state) => ({
    ...state,
    locking: true,
    error: null,
  })),
  on(SeatsActions.lockSeatSuccess, (state, { lock }) => {
    const updatedSeats = state.seats.map((seat) =>
      seat.id === lock.seatId ? { ...seat, status: 'locked' as const } : seat,
    );
    return {
      ...state,
      locking: false,
      activeLock: lock,
      lockExpiresAtMs: new Date(lock.expiresAt).getTime(),
      seats: updatedSeats,
      selectedSeat:
        state.selectedSeat && state.selectedSeat.id === lock.seatId
          ? updatedSeats.find((s) => s.id === lock.seatId) ?? state.selectedSeat
          : state.selectedSeat,
    };
  }),
  on(SeatsActions.lockSeatFailure, (state, { error, conflict, seatId }) => ({
    ...state,
    locking: false,
    error,
    seats: conflict
      ? state.seats.map((seat) =>
          seat.id === seatId ? { ...seat, status: 'locked' as const } : seat,
        )
      : state.seats,
  })),
  on(SeatsActions.unlockSeatSuccess, (state, { seatId }) => {
    const updatedSeats = state.seats.map((seat) =>
      seat.id === seatId ? { ...seat, status: 'available' as const } : seat,
    );
    return {
      ...state,
      activeLock:
        state.activeLock && state.activeLock.seatId === seatId ? null : state.activeLock,
      lockExpiresAtMs:
        state.activeLock && state.activeLock.seatId === seatId ? null : state.lockExpiresAtMs,
      seats: updatedSeats,
      selectedSeat:
        state.selectedSeat && state.selectedSeat.id === seatId
          ? updatedSeats.find((s) => s.id === seatId) ?? state.selectedSeat
          : state.selectedSeat,
    };
  }),
  on(SeatsActions.unlockSeatFailure, (state, { error }) => ({
    ...state,
    error,
  })),
  on(SeatsActions.clearActiveLock, (state) => ({
    ...state,
    activeLock: null,
    lockExpiresAtMs: null,
  })),
);
