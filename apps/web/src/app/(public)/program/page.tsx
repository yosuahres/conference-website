import { notFound } from "next/navigation";

import { formatDate } from "@/lib/format";
import { api } from "@/lib/api";
import { getActiveConference } from "@/lib/server-api";

export const metadata = { title: "Programme" };

function timeOf(value: string, timezone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(value));
}

export default async function ProgramPage() {
  const conference = await getActiveConference();
  if (!conference) notFound();

  const days = await api.conference.schedule();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Programme</h1>

      {days.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          The detailed programme will be published closer to the conference.
        </p>
      ) : null}

      {days.map(({ day, items }) => (
        <section key={day} className="mt-10">
          <h2 className="text-lg font-semibold">
            {formatDate(day, conference.timezone)}
          </h2>
          <ol className="mt-4 divide-y rounded-lg border bg-card">
            {items.map(({ item, speaker }) => (
              <li key={item.id} className="flex gap-4 p-5">
                <div className="w-28 shrink-0 text-sm tabular-nums text-muted-foreground">
                  {timeOf(item.startsAt, conference.timezone)}
                  {item.endsAt
                    ? ` – ${timeOf(item.endsAt, conference.timezone)}`
                    : ""}
                </div>
                <div className="min-w-0">
                  <p className="font-medium">{item.title}</p>
                  {speaker ? (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {speaker.name}
                      {speaker.affiliation ? ` · ${speaker.affiliation}` : ""}
                    </p>
                  ) : null}
                  {item.description ? (
                    <p className="mt-2 text-sm text-foreground/80">
                      {item.description}
                    </p>
                  ) : null}
                  {item.room ? (
                    <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                      {item.room}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
