import { createReducer, on } from '@ngrx/store';
import { MatchListItem } from '../../shared/models/match.model';
import { MatchesActions } from './matches.actions';

export interface MatchesState {
  readonly matches: readonly MatchListItem[];
  readonly upcoming: readonly MatchListItem[];
  readonly selectedMatchId: string | null;
  readonly loading: boolean;
  readonly upcomingLoading: boolean;
  readonly error: string | null;
}

export const initialMatchesState: MatchesState = {
  matches: [],
  upcoming: [],
  selectedMatchId: null,
  loading: false,
  upcomingLoading: false,
  error: null,
};

export const matchesReducer = createReducer(
  initialMatchesState,
  on(MatchesActions.loadMatches, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(MatchesActions.loadMatchesSuccess, (state, { matches }) => ({
    ...state,
    matches,
    loading: false,
  })),
  on(MatchesActions.loadMatchesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(MatchesActions.loadUpcoming, (state) => ({
    ...state,
    upcomingLoading: true,
  })),
  on(MatchesActions.loadUpcomingSuccess, (state, { matches }) => ({
    ...state,
    upcoming: matches,
    upcomingLoading: false,
  })),
  on(MatchesActions.loadUpcomingFailure, (state, { error }) => ({
    ...state,
    upcomingLoading: false,
    error,
  })),
  on(MatchesActions.selectMatch, (state, { matchId }) => ({
    ...state,
    selectedMatchId: matchId,
  })),
);
