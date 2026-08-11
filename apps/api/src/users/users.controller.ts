import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/authorization/roles.decorator';
import { RolesGuard } from '../common/authorization/roles.guard';
import { toPublicUser, type User } from '../database/schemas/users';
import { SetRoleDto } from './dto/set-role.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: User) {
    return toPublicUser(user);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Get()
  @Roles('admin')
  list() {
    return this.usersService.listUsers();
  }

  @Patch(':id/role')
  @Roles('admin')
  setRole(
    @CurrentUser() actor: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetRoleDto,
  ) {
    // Guard against an admin locking the committee out of its own console.
    if (actor.id === id && dto.role !== 'admin') {
      throw new Error('You cannot remove your own admin role.');
    }
    return this.usersService.setRole(id, dto.role);
  }
}
