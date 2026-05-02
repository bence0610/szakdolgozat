import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../strategies/jwt.strategy';

/**
 * Extracts the JWT-authenticated principal from the request. Returns
 * `undefined` when the route is anonymous (e.g. used with OptionalJwtAuthGuard).
 */
export const CurrentUser = createParamDecorator<
  unknown,
  ExecutionContext,
  AuthenticatedUser | undefined
>((_data, ctx) => {
  const request = ctx.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
  return request.user;
});
