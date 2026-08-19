import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/authorization/roles.decorator';
import { RolesGuard } from '../common/authorization/roles.guard';
import type { SubmissionStatus } from '../database/schemas/submissions';
import type { User } from '../database/schemas/users';
import {
  AssignReviewerDto,
  ConfirmUploadDto,
  DecisionDto,
  RequestUploadDto,
  ReviewDto,
  SaveSubmissionDto,
} from './dto/submission.dto';
import { SubmissionsService } from './submissions.service';

@Controller('submissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Get()
  listMine(@CurrentUser() user: User) {
    return this.submissionsService.listMine(user.id);
  }

  @Get('registerable')
  listRegisterable(@CurrentUser() user: User) {
    return this.submissionsService.listRegisterable(user.id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: SaveSubmissionDto) {
    return this.submissionsService.saveDraft(user, dto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveSubmissionDto,
  ) {
    return this.submissionsService.saveDraft(user, dto, id);
  }

  @Get(':id')
  getOne(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    if (user.role === 'admin') return this.submissionsService.getDetail(id);
    if (user.role === 'reviewer') {
      return this.submissionsService.getDetail(id, undefined, user.id);
    }
    return this.submissionsService.getDetail(id, user.id);
  }

  @Post(':id/uploads')
  requestUpload(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RequestUploadDto,
  ) {
    return this.submissionsService.requestUploadUrl(user, id, dto);
  }

  @Post(':id/uploads/confirm')
  confirmUpload(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConfirmUploadDto,
  ) {
    return this.submissionsService.confirmUpload(user, id, dto);
  }

  @Post(':id/submit')
  submit(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.submissionsService.submitForReview(user, id);
  }

  @Post(':id/withdraw')
  withdraw(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.submissionsService.withdraw(user, id);
  }

  @Get('admin/all')
  @Roles('admin', 'reviewer')
  listAll(@Query('status') status?: string) {
    return this.submissionsService.listAll(
      status ? ([status] as SubmissionStatus[]) : undefined,
    );
  }

  @Post(':id/reviewers')
  @Roles('admin')
  assignReviewer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignReviewerDto,
  ) {
    return this.submissionsService.assignReviewer(id, dto);
  }

  @Get('reviews/assigned')
  @Roles('reviewer', 'admin')
  assignedToMe(@CurrentUser() user: User) {
    return this.submissionsService.listAssignedTo(user.id);
  }

  @Post(':id/review')
  @Roles('reviewer', 'admin')
  saveReview(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewDto,
  ) {
    return this.submissionsService.saveReview(user, id, dto);
  }

  @Post(':id/decision')
  @Roles('admin')
  recordDecision(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DecisionDto,
  ) {
    return this.submissionsService.recordDecision(id, dto);
  }

  @Get('files/:fileId/download')
  @Roles('reviewer', 'admin')
  download(
    @CurrentUser() user: User,
    @Param('fileId', ParseIntPipe) fileId: number,
  ) {
    return this.submissionsService.getFileDownloadUrl(user, fileId);
  }
}
