import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';

import { DATABASE_CONNECTION } from '../database/database-connection';
import type { DrizzleDatabase } from '../database/merged-schemas';
import {
  conferences,
  pages,
  scheduleItems,
  speakers,
  tracks,
  type Conference,
} from '../database/schemas/conference';

@Injectable()
export class ConferenceService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly database: DrizzleDatabase,
  ) {}

  async getActive(): Promise<Conference | null> {
    const [row] = await this.database
      .select()
      .from(conferences)
      .where(eq(conferences.isActive, true))
      .limit(1);
    return row ?? null;
  }

  async requireActive(): Promise<Conference> {
    const conference = await this.getActive();
    if (!conference) {
      throw new NotFoundException(
        'No active conference. Seed one or set is_active in the admin.',
      );
    }
    return conference;
  }

  async getTracks(conferenceId: number) {
    return this.database
      .select()
      .from(tracks)
      .where(eq(tracks.conferenceId, conferenceId))
      .orderBy(asc(tracks.sortOrder), asc(tracks.name));
  }

  async getNavPages(conferenceId: number) {
    return this.database
      .select({
        slug: pages.slug,
        title: pages.title,
        navLabel: pages.navLabel,
      })
      .from(pages)
      .where(
        and(
          eq(pages.conferenceId, conferenceId),
          eq(pages.isPublished, true),
          eq(pages.showInNav, true),
        ),
      )
      .orderBy(asc(pages.sortOrder));
  }

  async getPage(conferenceId: number, slug: string) {
    const [row] = await this.database
      .select()
      .from(pages)
      .where(
        and(
          eq(pages.conferenceId, conferenceId),
          eq(pages.slug, slug),
          eq(pages.isPublished, true),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async getSpeakers(conferenceId: number) {
    return this.database
      .select()
      .from(speakers)
      .where(eq(speakers.conferenceId, conferenceId))
      .orderBy(asc(speakers.sortOrder), asc(speakers.name));
  }

  async getSchedule(conferenceId: number) {
    const rows = await this.database
      .select({ item: scheduleItems, speaker: speakers })
      .from(scheduleItems)
      .leftJoin(speakers, eq(scheduleItems.speakerId, speakers.id))
      .where(eq(scheduleItems.conferenceId, conferenceId))
      .orderBy(asc(scheduleItems.startsAt));

    const byDay = new Map<string, typeof rows>();
    for (const row of rows) {
      const bucket = byDay.get(row.item.day);
      if (bucket) bucket.push(row);
      else byDay.set(row.item.day, [row]);
    }

    return [...byDay.entries()].map(([day, items]) => ({ day, items }));
  }

  isSubmissionOpen(conference: Conference, now = new Date()) {
    if (conference.submissionOpensAt && now < conference.submissionOpensAt)
      return false;
    if (conference.submissionDeadline && now > conference.submissionDeadline)
      return false;
    return true;
  }

  isRegistrationOpen(conference: Conference, now = new Date()) {
    return (
      !conference.registrationDeadline || now <= conference.registrationDeadline
    );
  }
}
