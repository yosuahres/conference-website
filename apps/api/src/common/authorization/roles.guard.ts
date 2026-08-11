import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { User, UserRole } from '../../database/schemas/users';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @Roles() on the route means authentication alone is enough.
    if (!required?.length) return true;

    const user = context.switchToHttp().getRequest<{ user?: User }>().user;
    if (!user) throw new ForbiddenException('Not authenticated.');

    if (!required.includes(user.role)) {
      throw new ForbiddenException(
        `This action requires the ${required.join(' or ')} role.`,
      );
    }

    return true;
  }
}
