export type ChatbotRole = 'user' | 'assistant';

export interface ChatbotMessage {
  readonly id: string;
  readonly role: ChatbotRole;
  readonly content: string;
  readonly createdAt: string;
}

export interface ChatbotSendRequest {
  readonly message: string;
  readonly conversationId?: string;
}

export interface ChatbotSendResponse {
  readonly conversationId: string;
  readonly reply: string;
  readonly model: string;
}
