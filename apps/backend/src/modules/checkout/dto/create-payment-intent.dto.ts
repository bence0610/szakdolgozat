import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TicketLineItemDto {
  @ApiProperty()
  @IsString()
  @IsUUID()
  matchId!: string;

  @ApiProperty()
  @IsString()
  @IsUUID()
  seatId!: string;
}

export class CreatePaymentIntentDto {
  @ApiProperty({ type: () => [TicketLineItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TicketLineItemDto)
  items!: TicketLineItemDto[];
}

export class CreatePaymentIntentResponseDto {
  @ApiProperty()
  paymentIntentId!: string;

  @ApiProperty()
  clientSecret!: string;

  @ApiProperty({ description: 'Amount actually charged after applying tier discount, in minor units.' })
  amount!: number;

  @ApiProperty()
  currency!: string;

  @ApiProperty({ description: 'Loyalty tier discount percentage applied (0-15).' })
  discountPercent!: number;

  @ApiProperty({ description: 'Original list price total, in minor units.' })
  originalAmount!: number;

  @ApiProperty()
  discountAmount!: number;

  @ApiProperty({ type: [String] })
  ticketIds!: string[];
}
