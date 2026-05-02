import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class PaymentIntentSeatDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  seatId!: string;

  @ApiProperty({
    description:
      'A `POST /matches/:matchId/seats/:seatId/lock` válaszában kapott ownerToken — szerveroldalon ellenőrizzük, hogy még mindig a hívóé a szék.',
  })
  @IsString()
  ownerToken!: string;
}

export class CreatePaymentIntentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  matchId!: string;

  @ApiProperty({ type: [PaymentIntentSeatDto], minItems: 1, maxItems: 6 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => PaymentIntentSeatDto)
  seats!: PaymentIntentSeatDto[];
}
