import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { seatsReducer } from './seats.reducer';
import { SeatsEffects } from './seats.effects';

export const SEATS_FEATURE_KEY = 'seats';

export const provideSeatsFeature = () => [
  provideState(SEATS_FEATURE_KEY, seatsReducer),
  provideEffects(SeatsEffects),
];
