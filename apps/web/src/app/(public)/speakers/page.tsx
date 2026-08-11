import { notFound } from "next/navigation";

import { api } from "@/lib/api";
import { getActiveConference } from "@/lib/server-api";

export const metadata = { title: "Speakers" };

export default async function SpeakersPage() {
  const conference = await getActiveConference();
  if (!conference) notFound();

  const speakers = await api.conference.speakers();
  const keynotes = speakers.filter((speaker) => speaker.isKeynote);
  const invited = speakers.filter((speaker) => !speaker.isKeynote);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Speakers</h1>

      {speakers.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Speakers will be announced soon.
        </p>
      ) : null}

      {[
        { title: "Keynote speakers", people: keynotes },
        { title: "Invited speakers", people: invited },
      ]
        .filter((group) => group.people.length > 0)
        .map((group) => (
          <section key={group.title} className="mt-10">
            <h2 className="text-lg font-semibold">{group.title}</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {group.people.map((speaker) => (
                <div key={speaker.id} className="rounded-lg border bg-card p-6">
                  <p className="text-base font-semibold">{speaker.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[speaker.title, speaker.affiliation, speaker.country]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {speaker.bio ? (
                    <p className="mt-3 text-sm leading-6 text-foreground/80">
                      {speaker.bio}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
