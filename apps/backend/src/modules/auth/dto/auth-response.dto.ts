import { ApiProperty } from '@nestjs/swagger';
import { LoyaltyTier, UserRole } from '../../../database/entities';

export class AuthUserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'fan@kte.hu' })
  email!: string;

  @ApiProperty({ example: 'Kovács' })
  firstName!: string;

  @ApiProperty({ example: 'Béla' })
  lastName!: string;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;

  @ApiProperty({ enum: LoyaltyTier })
  loyaltyTier!: LoyaltyTier;

  @ApiProperty({ example: 100 })
  loyaltyPoints!: number;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({
    description:
      'Refresh token plain string. Általában HttpOnly cookie-ban érkezik, de itt is elérhető teszteléshez.',
  })
  refreshToken!: string;

  @ApiProperty({ example: 900, description: 'Access token TTL másodpercben.' })
  expiresIn!: number;

  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}
