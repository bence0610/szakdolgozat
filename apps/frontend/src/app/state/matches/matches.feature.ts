import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { matchesReducer } from './matches.reducer';
import { MatchesEffects } from './matches.effects';

export const MATCHES_FEATURE_KEY = 'matches';

export const provideMatchesFeature = () => [
  provideState(MATCHES_FEATURE_KEY, matchesReducer),
  provideEffects(MatchesEffects),
];
