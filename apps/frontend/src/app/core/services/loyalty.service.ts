import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { LoyaltySnapshotResponse, LoyaltyTierResponse } from '../models/loyalty.models';

@Injectable({ providedIn: 'root' })
export class LoyaltyService {
  private readonly http = inject(HttpClient);

  getSnapshot(): Observable<LoyaltySnapshotResponse> {
    return this.http.get<LoyaltySnapshotResponse>('/loyalty/me');
  }

  getTiers(): Observable<LoyaltyTierResponse[]> {
    return this.http.get<LoyaltyTierResponse[]>('/loyalty/tiers');
  }
}
