import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  MatchDetail,
  MatchListItem,
  QueryMatchesParams,
} from '../models/match.model';

@Injectable({ providedIn: 'root' })
export class MatchesApiService {
  private readonly http = inject(HttpClient);

  /**
   * GET /matches — filtered list of matches with availableSeats.
   */
  list(params: QueryMatchesParams = {}): Observable<MatchListItem[]> {
    let httpParams = new HttpParams();
    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params.from) {
      httpParams = httpParams.set('from', params.from);
    }
    if (params.to) {
      httpParams = httpParams.set('to', params.to);
    }
    if (params.limit !== undefined) {
      httpParams = httpParams.set('limit', String(params.limit));
    }
    return this.http.get<MatchListItem[]>('/matches', { params: httpParams });
  }

  /**
   * GET /matches/upcoming — next 5 upcoming on_sale / scheduled matches.
   */
  upcoming(): Observable<MatchListItem[]> {
    return this.http.get<MatchListItem[]>('/matches/upcoming');
  }

  /**
   * GET /matches/:id — detailed match record.
   */
  detail(matchId: string): Observable<MatchDetail> {
    return this.http.get<MatchDetail>(`/matches/${matchId}`);
  }
}
