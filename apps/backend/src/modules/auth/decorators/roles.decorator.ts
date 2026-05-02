import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../../database/entities';

export const ROLES_KEY = 'roles';

/**
 * Restricts a route to a list of {@link UserRole} values. Combine with
 * {@link RolesGuard} (or a guard chain that includes it). Without
 * {@link RolesGuard} active on the route the decorator has no runtime effect.
 *
 * Example:
 * ```ts
 * @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Get('stats')
 * ```
 */
export const Roles = (...roles: UserRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
