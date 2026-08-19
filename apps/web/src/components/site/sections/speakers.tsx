import Image from "next/image";
import Link from "next/link";

import { speakerGroups } from "@/content/site";
import { Reveal } from "../reveal";
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
            <Reveal>
              <h2 className="text-center font-display text-[clamp(1.75rem,3.4vw,2.5rem)] font-bold tracking-[-0.03em]">
                {group.heading}
              </h2>
              <div className="rule mx-auto mt-3.5 w-28" />
            </Reveal>

            <ul
              className={`mt-16 grid gap-x-3 gap-y-16 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-4 sm:gap-y-32 ${
                group.people.length === 1
                  ? "grid-cols-1 justify-items-center"
                  : "grid-cols-2"
              }`}
            >
              {group.people.map((speaker) => (
                <li
                  key={speaker.photo}
                  className={`sm:w-[360px] ${
                    group.people.length === 1 ? "w-1/2" : "w-full"
                  }`}
                >
                  <div className="relative mx-auto w-full sm:w-[190px]">
                    <div className="relative aspect-[3/4] w-full overflow-hidden">
                      <Image
                        src={speaker.photo}
                        alt={speaker.name ?? ""}
                        fill
                        sizes="(min-width: 640px) 190px, 50vw"
                        className="object-cover"
                      />
                    </div>
                  </div>

                  <p className="relative z-10 mx-auto -mt-4 w-full bg-white px-2 py-2 text-center text-xs font-semibold leading-snug text-deep sm:w-fit sm:min-w-[90%] sm:max-w-full sm:whitespace-nowrap sm:px-3.5 sm:py-2.5 sm:text-[0.84rem]">
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
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
    </Section>
  );
}
