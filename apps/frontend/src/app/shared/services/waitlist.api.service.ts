import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  JoinWaitlistRequest,
  WaitlistEntry,
} from '../models/waitlist.model';

@Injectable({ providedIn: 'root' })
export class WaitlistApiService {
  private readonly http = inject(HttpClient);

  join(payload: JoinWaitlistRequest): Observable<WaitlistEntry> {
    return this.http.post<WaitlistEntry>('/waitlist', payload);
  }

  listMine(): Observable<readonly WaitlistEntry[]> {
    return this.http.get<readonly WaitlistEntry[]>('/waitlist/me');
  }

  leave(matchId: string): Observable<void> {
    return this.http.delete<void>(`/waitlist/${matchId}`);
  }

  claim(matchId: string): Observable<{ ok: true }> {
    return this.http.post<{ ok: true }>(`/waitlist/${matchId}/claim`, {});
  }
}
