import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/server/db";
import {
  conferences,
  pages,
  scheduleItems,
  speakers,
  tracks,
  type Conference,
} from "@/server/db/schema";

/**
 * The site always renders one edition. Everything public reads through here so
 * switching to next year's conference is a single `is_active` flip.
 */
export const getActiveConference = cache(
  async (): Promise<Conference | null> => {
    const [row] = await db
      .select()
      .from(conferences)
      .where(eq(conferences.isActive, true))
      .limit(1);
    return row ?? null;
  },
);

/** Same, but throws — for routes that cannot render without a conference. */
export async function requireActiveConference(): Promise<Conference> {
  const conference = await getActiveConference();
  if (!conference) {
    throw new Error(
      "No active conference. Seed one with `pnpm db:seed` or set is_active in the admin.",
    );
  }
  return conference;
}

export async function getActiveConferenceName(): Promise<string> {
  const conference = await getActiveConference();
  return conference?.name ?? "Conference";
}

export const getTracks = cache(async (conferenceId: number) => {
  return db
    .select()
    .from(tracks)
    .where(eq(tracks.conferenceId, conferenceId))
    .orderBy(asc(tracks.sortOrder), asc(tracks.name));
});

export const getNavPages = cache(async (conferenceId: number) => {
  return db
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
});

export const getPage = cache(async (conferenceId: number, slug: string) => {
  const [row] = await db
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
});

export const getSpeakers = cache(async (conferenceId: number) => {
  return db
    .select()
    .from(speakers)
    .where(eq(speakers.conferenceId, conferenceId))
    .orderBy(asc(speakers.sortOrder), asc(speakers.name));
});

export const getSchedule = cache(async (conferenceId: number) => {
  const rows = await db
    .select({
      item: scheduleItems,
      speaker: speakers,
    })
    .from(scheduleItems)
    .leftJoin(speakers, eq(scheduleItems.speakerId, speakers.id))
    .where(eq(scheduleItems.conferenceId, conferenceId))
    .orderBy(asc(scheduleItems.startsAt));

  // Group into days for the programme page.
  const byDay = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = row.item.day;
    const bucket = byDay.get(key);
    if (bucket) bucket.push(row);
    else byDay.set(key, [row]);
  }

  return [...byDay.entries()].map(([day, items]) => ({ day, items }));
});

/** Deadline helpers used by both the UI and the server actions. */
export function isSubmissionOpen(conference: Conference, now = new Date()) {
  const opens = conference.submissionOpensAt;
  const closes = conference.submissionDeadline;
  if (opens && now < opens) return false;
  if (closes && now > closes) return false;
  return true;
}

export function isRegistrationOpen(conference: Conference, now = new Date()) {
  const closes = conference.registrationDeadline;
  return !closes || now <= closes;
}
