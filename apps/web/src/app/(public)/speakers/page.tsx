import Image from "next/image";

import { ScrollToHash } from "@/components/site/scroll-to-hash";
import { Container } from "@/components/site/ui";
import { event, speakerGroups } from "@/content/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Speakers",
  description: `Plenary, keynote and invited speakers at ${event.shortName} ${event.edition}, including researchers from ITB, ITS, the University of Southampton, NYU Abu Dhabi, CSIR-NCL and Chulalongkorn University.`,
  path: "/speakers",
});

export default function SpeakersPage() {
  return (
    <div className="surface-light bg-mist">
      <ScrollToHash />
      <Container className="py-16 md:py-20">
        {speakerGroups.map((group, groupIndex) => (
          <section
            key={group.heading}
            className={groupIndex === 0 ? "" : "mt-24 md:mt-28"}
          >
            <h2 className="font-display text-[clamp(1.6rem,4vw,2.5rem)] font-semibold uppercase tracking-[-0.02em] text-navy">
              {group.heading}
            </h2>

            {group.people.map((speaker, i) => (
              <article
                key={speaker.photo}
                id={speaker.slug ?? undefined}
                className={`scroll-mt-20 xl:scroll-mt-36 ${
                  i === 0
                    ? "mt-12"
                    : "mt-14 border-t border-line pt-14 md:mt-16 md:pt-16"
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className="relative size-[200px] overflow-hidden rounded-full bg-shell md:size-[240px]">
                    <Image
                      src={speaker.photo}
                      alt={speaker.name ?? ""}
                      fill
                      sizes="240px"
                      className="object-cover"
                    />
                  </div>

                  <h3 className="mt-6 text-center font-display text-[clamp(1.2rem,2.5vw,1.55rem)] font-semibold tracking-[-0.02em]">
                    {speaker.name ?? "To be announced"}
                  </h3>
                  {speaker.institution ? (
                    <p className="mt-2 text-center text-[0.9rem] text-subtle">
                      {speaker.institution}
                    </p>
                  ) : null}
                </div>

                <div className="mx-auto mt-10 max-w-5xl">
                  {speaker.bio.length > 0 ? (
                    speaker.bio.map((paragraph, p) => (
                      <p
                        key={paragraph.slice(0, 40)}
                        className={`hyphens-auto text-justify text-[1.02rem] leading-[1.8] ${p === 0 ? "" : "mt-1.5"}`}
                      >
                        {paragraph}
                      </p>
                    ))
                  ) : (
                    <p className="hyphens-auto text-justify text-[1.02rem] leading-[1.8] text-subtle">
                      {speaker.name
                        ? `A full biography for ${speaker.name} is not published yet.`
                        : "This speaker has not been announced yet."}
                    </p>
                  )}

                  {speaker.topic ? (
                    <>
                      <p className="mt-8 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-faint">
                        Talk
                      </p>
                      <p className="mt-2 font-display text-[1.15rem] font-semibold leading-[1.35] tracking-[-0.02em]">
                        {speaker.topic}
                      </p>
                    </>
                  ) : null}
                </div>
              </article>
            ))}
          </section>
        ))}
      </Container>
    </div>
  );
}
