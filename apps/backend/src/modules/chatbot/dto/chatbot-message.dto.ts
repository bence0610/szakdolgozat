import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ChatbotMessageDto {
  @ApiProperty({ description: 'A felhasználó kérdése (max 1000 karakter)' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message!: string;

  @ApiPropertyOptional({
    description:
      'Kliens által generált beszélgetés-azonosító. Ha hiányzik, a backend új azonosítót oszt ki és visszaadja a válaszban.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  conversationId?: string;
}

export class ChatbotResponseDto {
  @ApiProperty({ description: 'Beszélgetés azonosítója (perzisztens 24 óráig)' })
  conversationId!: string;

  @ApiProperty({ description: 'A modell válasza' })
  reply!: string;

  @ApiProperty({ description: 'A modell, amit a háttér használt' })
  model!: string;
}
