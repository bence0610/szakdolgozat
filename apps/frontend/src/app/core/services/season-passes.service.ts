import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PassLoanResponse, SeasonPassResponse } from '../models/season-pass.models';

export interface CreateLoanPayload {
  matchId: string;
  borrowerEmail: string;
}

export interface CancelLoanPayload {
  reason?: string;
}

@Injectable({ providedIn: 'root' })
export class SeasonPassesService {
  private readonly http = inject(HttpClient);

  listMine(): Observable<SeasonPassResponse[]> {
    return this.http.get<SeasonPassResponse[]>('/season-passes/me');
  }

  createLoan(passId: string, payload: CreateLoanPayload): Observable<PassLoanResponse> {
    return this.http.post<PassLoanResponse>(`/season-passes/${passId}/loans`, payload);
  }

  cancelLoan(passId: string, loanId: string, payload: CancelLoanPayload = {}): Observable<PassLoanResponse> {
    return this.http.request<PassLoanResponse>('DELETE', `/season-passes/${passId}/loans/${loanId}`, {
      body: payload,
    });
  }

  acceptLoan(invitationToken: string): Observable<PassLoanResponse> {
    return this.http.post<PassLoanResponse>(
      `/season-passes/loans/accept/${encodeURIComponent(invitationToken)}`,
      {},
    );
  }
}
