import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CheckoutService } from './checkout.service';
import {
  CreatePaymentIntentDto,
  CreatePaymentIntentResponseDto,
} from './dto/create-payment-intent.dto';

interface AuthenticatedRequest extends Request {
  user?: { sub: string; userId?: string; id?: string };
}

@ApiTags('Checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('payment-intents')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOkResponse({ type: CreatePaymentIntentResponseDto })
  async createIntent(
    @Body() body: CreatePaymentIntentDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<CreatePaymentIntentResponseDto> {
    const userId = req.user?.sub ?? req.user?.userId ?? req.user?.id;
    if (!userId) {
      throw new Error('Authenticated user id missing from request');
    }
    return this.checkoutService.createPaymentIntent(userId, body);
  }
}
