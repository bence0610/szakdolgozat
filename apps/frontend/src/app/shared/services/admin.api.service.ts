import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  MatchOccupancy,
  RevenueStats,
} from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);

  revenue(days = 30): Observable<RevenueStats> {
    const params = new HttpParams().set('days', String(days));
    return this.http.get<RevenueStats>('/admin/revenue', { params });
  }

  occupancy(matchId: string): Observable<MatchOccupancy> {
    return this.http.get<MatchOccupancy>(`/admin/matches/${matchId}/occupancy`);
  }
}
