import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { ChatbotRateLimitGuard } from './chatbot-rate-limit.guard';
import { ChatbotService } from './chatbot.service';
import { ChatbotMessageDto, ChatbotResponseDto } from './dto';

@ApiTags('Chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Public()
  @Post('message')
  @UseGuards(OptionalJwtAuthGuard, ChatbotRateLimitGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Üzenet küldése a KTE AI Asszisztensnek',
    description:
      'Anonim és autentikált hívókat egyaránt elfogad (eltérő rate limit). A `conversationId` perzisztens 24 óráig.',
  })
  @ApiOkResponse({ type: ChatbotResponseDto })
  async sendMessage(
    @Body() dto: ChatbotMessageDto,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): Promise<ChatbotResponseDto> {
    const reply = await this.chatbotService.sendMessage({
      message: dto.message,
      conversationId: dto.conversationId,
      userLabel: user?.id,
    });
    return reply;
  }
}
