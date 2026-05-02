import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreatePaymentIntentRequest,
  MatchWeatherForecast,
  PaymentIntentResponse,
} from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentsApiService {
  private readonly http = inject(HttpClient);

  createIntent(payload: CreatePaymentIntentRequest): Observable<PaymentIntentResponse> {
    return this.http.post<PaymentIntentResponse>('/payments/create-intent', payload, {
      withCredentials: true,
    });
  }

  weatherForMatch(matchId: string): Observable<MatchWeatherForecast> {
    return this.http.get<MatchWeatherForecast>(`/weather/match/${matchId}`);
  }
}
