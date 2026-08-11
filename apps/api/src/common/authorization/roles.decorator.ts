import { SetMetadata } from '@nestjs/common';

import type { UserRole } from '../../database/schemas/users';

export const ROLES_KEY = 'roles';

/** Restricts a route to the listed roles. Always pair with JwtAuthGuard. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
