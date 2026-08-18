import { Controller, Get, NotFoundException, Param } from '@nestjs/common';

import { ConferenceService } from './conference.service';

@Controller('conference')
export class ConferenceController {
  constructor(private readonly conferenceService: ConferenceService) {}

  @Get()
  async getActive() {
    const conference = await this.conferenceService.requireActive();
    return {
      ...conference,
      submissionOpen: this.conferenceService.isSubmissionOpen(conference),
      registrationOpen: this.conferenceService.isRegistrationOpen(conference),
    };
  }

  @Get('tracks')
  async tracks() {
    const conference = await this.conferenceService.requireActive();
    return this.conferenceService.getTracks(conference.id);
  }

  @Get('speakers')
  async speakers() {
    const conference = await this.conferenceService.requireActive();
    return this.conferenceService.getSpeakers(conference.id);
  }

  @Get('schedule')
  async schedule() {
    const conference = await this.conferenceService.requireActive();
    return this.conferenceService.getSchedule(conference.id);
  }

  @Get('nav')
  async nav() {
    const conference = await this.conferenceService.requireActive();
    return this.conferenceService.getNavPages(conference.id);
  }

  @Get('pages/:slug')
  async page(@Param('slug') slug: string) {
    const conference = await this.conferenceService.requireActive();
    const page = await this.conferenceService.getPage(conference.id, slug);
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }
}
