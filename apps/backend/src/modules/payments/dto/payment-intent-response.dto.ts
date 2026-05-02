import { ApiProperty } from '@nestjs/swagger';

export class PaymentIntentSeatLineDto {
  @ApiProperty({ format: 'uuid' })
  seatId!: string;

  @ApiProperty()
  section!: string;

  @ApiProperty()
  row!: string;

  @ApiProperty()
  seatNumber!: number;

  @ApiProperty()
  price!: number;
}

export class PaymentIntentResponseDto {
  @ApiProperty()
  paymentIntentId!: string;

  @ApiProperty({
    description: 'Stripe.js confirmCardPayment hívásához használandó client secret.',
  })
  clientSecret!: string;

  @ApiProperty({ example: 'huf' })
  currency!: string;

  @ApiProperty({ description: 'Teljes összeg HUF-ban (egész szám).' })
  amount!: number;

  @ApiProperty({ type: [PaymentIntentSeatLineDto] })
  lineItems!: PaymentIntentSeatLineDto[];
}
