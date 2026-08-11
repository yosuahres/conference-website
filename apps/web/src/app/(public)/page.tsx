import Link from "next/link";
import { CalendarDays, FileText, MapPin, Users } from "lucide-react";

import { Button } from "@shared/ui/components/ui/button";
import { Countdown } from "@/components/countdown";
import { formatDate, formatDateRange } from "@/lib/format";
import {
  getActiveConference,
  getSpeakers,
  getTracks,
  isSubmissionOpen,
} from "@/server/conference/queries";

export default async function HomePage() {
  const conference = await getActiveConference();

  if (!conference) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">No active conference</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Run{" "}
          <code className="rounded bg-muted px-1.5 py-0.5">pnpm db:seed</code>{" "}
          or mark an edition active in the admin area.
        </p>
      </div>
    );
  }

  const [tracks, speakers] = await Promise.all([
    getTracks(conference.id),
    getSpeakers(conference.id),
  ]);

  const keynotes = speakers.filter((speaker) => speaker.isKeynote);
  const submissionsOpen = isSubmissionOpen(conference);

  const keyDates = [
    { label: "Submission deadline", value: conference.submissionDeadline },
    { label: "Notification of acceptance", value: conference.notificationDate },
    { label: "Camera-ready due", value: conference.cameraReadyDeadline },
    { label: "Registration deadline", value: conference.registrationDeadline },
    { label: "Conference dates", value: conference.startsOn },
  ].filter((entry) => entry.value !== null);

  return (
    <>
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20">
          {conference.edition ? (
            <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              {conference.edition}
            </p>
          ) : null}
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            {conference.name}
          </h1>
          {conference.tagline ? (
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              {conference.tagline}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <span className="flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              {formatDateRange(
                conference.startsOn,
                conference.endsOn,
                conference.timezone,
              )}
            </span>
            {conference.venueName ? (
              <span className="flex items-center gap-2">
                <MapPin className="size-4 text-muted-foreground" />
                {conference.venueName}
                {conference.city ? `, ${conference.city}` : ""}
              </span>
            ) : null}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" disabled={!submissionsOpen}>
              <Link href="/dashboard/submissions/new">
                {submissionsOpen ? "Submit your paper" : "Submissions closed"}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/register">Register to attend</Link>
            </Button>
          </div>

          {conference.submissionDeadline && submissionsOpen ? (
            <div className="mt-10 max-w-sm">
              <Countdown
                target={conference.submissionDeadline.toISOString()}
                label="Submissions close in"
              />
            </div>
          ) : null}
        </div>
      </section>

      {conference.description ? (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">
            About the conference
          </h2>
          <p className="mt-4 max-w-3xl text-[15px] leading-7 text-muted-foreground">
            {conference.description}
          </p>
        </section>
      ) : null}

      {keyDates.length > 0 ? (
        <section className="border-y bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-2xl font-semibold tracking-tight">Key dates</h2>
            <dl className="mt-6 grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {keyDates.map((entry) => (
                <div key={entry.label} className="bg-card p-5">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {entry.label}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold">
                    {formatDate(entry.value, conference.timezone)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      ) : null}

      {tracks.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-muted-foreground" />
            <h2 className="text-2xl font-semibold tracking-tight">Topics</h2>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tracks.map((track) => (
              <div key={track.id} className="rounded-lg border bg-card p-5">
                <p className="font-medium">{track.name}</p>
                {track.description ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {track.description}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {keynotes.length > 0 ? (
        <section className="border-t">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="size-5 text-muted-foreground" />
                <h2 className="text-2xl font-semibold tracking-tight">
                  Keynote speakers
                </h2>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/speakers">All speakers</Link>
              </Button>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {keynotes.slice(0, 6).map((speaker) => (
                <div key={speaker.id} className="rounded-lg border bg-card p-5">
                  <p className="font-medium">{speaker.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {[speaker.title, speaker.affiliation]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
