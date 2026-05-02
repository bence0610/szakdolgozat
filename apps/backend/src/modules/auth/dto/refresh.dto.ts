import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RefreshDto {
  @ApiProperty({
    required: false,
    description:
      'Opcionális — ha nem érkezik HttpOnly cookie-ban, fallbackként a body-ban is elfogadjuk.',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
