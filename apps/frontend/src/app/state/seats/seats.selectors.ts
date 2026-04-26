import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SEATS_FEATURE_KEY } from './seats.feature';
import { SeatsState } from './seats.reducer';

const selectSeatsFeature = createFeatureSelector<SeatsState>(SEATS_FEATURE_KEY);

export const selectSeats = createSelector(selectSeatsFeature, (state) => state.seats);

export const selectSectorSummary = createSelector(
  selectSeatsFeature,
  (state) => state.sectorSummary,
);

export const selectSeatsLoading = createSelector(
  selectSeatsFeature,
  (state) => state.loading,
);

export const selectSeatsError = createSelector(selectSeatsFeature, (state) => state.error);

export const selectSelectedSection = createSelector(
  selectSeatsFeature,
  (state) => state.selectedSection,
);

export const selectSelectedSeat = createSelector(
  selectSeatsFeature,
  (state) => state.selectedSeat,
);

export const selectAccessibleOnly = createSelector(
  selectSeatsFeature,
  (state) => state.accessibleOnly,
);

export const selectActiveLock = createSelector(
  selectSeatsFeature,
  (state) => state.activeLock,
);

export const selectLockExpiresAtMs = createSelector(
  selectSeatsFeature,
  (state) => state.lockExpiresAtMs,
);

export const selectLocking = createSelector(selectSeatsFeature, (state) => state.locking);

export const selectSeatsForSelectedSector = createSelector(
  selectSeats,
  selectSelectedSection,
  selectAccessibleOnly,
  (seats, section, accessibleOnly) => {
    if (section === null) {
      return [];
    }
    return seats.filter((seat) => {
      if (seat.section !== section) {
        return false;
      }
      if (accessibleOnly && !seat.isAccessible) {
        return false;
      }
      return true;
    });
  },
);
