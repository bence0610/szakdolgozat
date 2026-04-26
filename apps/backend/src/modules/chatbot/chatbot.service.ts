import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnthropicConfig } from '../../config';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Placeholder. Iteration 3 will implement the Claude-backed chat
   * pipeline (claude-sonnet-4-20250514) with conversation history,
   * prompt caching, and KTE knowledge-base context.
   */
  describe(): { model: string; status: 'configured' } {
    const anthropic = this.configService.getOrThrow<AnthropicConfig>('anthropic');
    this.logger.debug(`Chatbot configured with model ${anthropic.model}`);
    return { model: anthropic.model, status: 'configured' };
  }
}
