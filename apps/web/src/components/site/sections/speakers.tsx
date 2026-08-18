import Image from "next/image";
import Link from "next/link";

import { speakerGroups } from "@/content/site";
import { Container, Section } from "../ui";

export function Speakers() {
  return (
    <Section
      id="speakers"
      surface="dark"
      className="relative overflow-hidden !bg-slate-900"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <Image
          src="/photos/photonics-bg.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/85 via-slate-900/70 to-slate-900" />
      </div>

      <Container className="relative z-10">
        {speakerGroups.map((group, groupIndex) => (
          <div
            key={group.heading}
            className={groupIndex === 0 ? "" : "mt-20 md:mt-24"}
          >
            <h2 className="text-center font-display text-[clamp(1.75rem,3.4vw,2.5rem)] font-bold tracking-[-0.03em]">
              {group.heading}
            </h2>
            <div className="rule mx-auto mt-6 w-28" />

            <ul className="mt-16 flex flex-wrap justify-center gap-x-5 gap-y-28 sm:gap-x-16 sm:gap-y-40 md:gap-x-32 lg:gap-x-40">
              {group.people.map((speaker) => (
                <li
                  key={speaker.photo}
                  className="w-[44%] max-w-[190px] sm:w-[190px]"
                >
                  <div className="relative w-full">
                    <div className="relative aspect-[3/4] w-full overflow-hidden">
                      <Image
                        src={speaker.photo}
                        alt={speaker.name ?? ""}
                        fill
                        sizes="190px"
                        className="object-cover"
                      />
                    </div>

                    <p className="absolute -inset-x-1 top-full z-10 -translate-y-4 bg-white px-2.5 py-2.5 text-center text-[0.9rem] font-semibold leading-[1.35] text-deep sm:-inset-x-5 sm:px-3.5 sm:text-[0.95rem]">
                      {speaker.name && speaker.slug ? (
                        <Link
                          href={`/speakers#${speaker.slug}`}
                          scroll={false}
                          className="underline underline-offset-[3px]"
                        >
                          {speaker.name}
                        </Link>
                      ) : (
                        <span className="text-deep/60">To be announced</span>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
    </Section>
  );
}
