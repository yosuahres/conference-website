import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response as ExpressResponse } from 'express';

import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/authorization/roles.decorator';
import { RolesGuard } from '../common/authorization/roles.guard';
import { PAYMENT_THROTTLE } from '../common/throttling/throttler.config';
import type { User } from '../database/schemas/users';
import { CreateRegistrationDto } from './dto/registration.dto';
import { RegistrationsService } from './registrations.service';

@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Get('tiers')
  tiers() {
    return this.registrationsService.getAvailableTiers();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  listMine(@CurrentUser() user: User) {
    return this.registrationsService.listMine(user.id);
  }

  @Post()
  @Throttle(PAYMENT_THROTTLE)
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: User, @Body() dto: CreateRegistrationDto) {
    return this.registrationsService.create(user, dto);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  stats() {
    return this.registrationsService.getStats();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  listAll() {
    return this.registrationsService.listAll();
  }

  @Get('admin/export.csv')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportCsv(@Res({ passthrough: true }) response: ExpressResponse) {
    const { filename, content } = await this.registrationsService.exportCsv();
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    return content;
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getOne(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    const scopeToOwner = user.role === 'admin' ? undefined : user.id;
    return this.registrationsService.getDetail(id, scopeToOwner);
  }

  @Post(':id/pay')
  @Throttle(PAYMENT_THROTTLE)
  @UseGuards(JwtAuthGuard)
  retryPayment(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.registrationsService.retryPayment(user, id);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.registrationsService.cancel(user, id);
  }
}
