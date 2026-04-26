import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ChatbotService } from './chatbot.service';

@ApiTags('Chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Get('info')
  @ApiOkResponse({ description: 'Chatbot configuration info' })
  info(): { model: string; status: 'configured' } {
    return this.chatbotService.describe();
  }
}
