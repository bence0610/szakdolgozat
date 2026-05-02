import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ChatbotSendRequest,
  ChatbotSendResponse,
} from '../models/chatbot.model';

@Injectable({ providedIn: 'root' })
export class ChatbotApiService {
  private readonly http = inject(HttpClient);

  send(payload: ChatbotSendRequest): Observable<ChatbotSendResponse> {
    return this.http.post<ChatbotSendResponse>('/chatbot/message', payload);
  }
}
