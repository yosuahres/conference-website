import { IsIn } from 'class-validator';

import type { UserRole } from '../../database/schemas/users';

export class SetRoleDto {
  @IsIn(['attendee', 'reviewer', 'admin'])
  role: UserRole;
}
