import Image from "next/image";

import { event, hostCity } from "@/content/site";
import { Reveal } from "../reveal";
import { Container, LinkButton } from "../ui";

export function Hero() {
  return (
    <section
      id="home"
      className="relative flex min-h-[72svh] flex-col items-center justify-center pb-40 pt-16 md:pb-44 md:pt-20"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <Image
          src={hostCity.feature.photo}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-[0.55]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(115%_85%_at_50%_16%,rgb(var(--site-beam)/0.22),transparent_62%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-shell/55 via-shell/25 to-paper" />
      </div>

      <Container className="relative z-10 text-center">
        <Reveal
          as="h1"
          className="font-display text-[clamp(3.5rem,15vw,12.5rem)] font-semibold leading-[0.85] tracking-[-0.05em]"
        >
          {event.shortName}
        </Reveal>

        <Reveal
          as="p"
          delay={120}
          className="mx-auto mt-4 max-w-2xl text-balance text-[clamp(0.95rem,1.6vw,1.15rem)] font-medium leading-[1.4] text-subtle"
        >
          {event.fullName}
        </Reveal>

        <Reveal
          as="p"
          delay={240}
          className="mx-auto mt-8 max-w-3xl text-balance font-display text-[clamp(1.35rem,2.6vw,2rem)] font-semibold leading-[1.2] tracking-[-0.025em] text-ink"
        >
          {event.theme}
        </Reveal>

        <Reveal
          as="p"
          delay={360}
          className="mt-10 font-display text-[clamp(1rem,1.7vw,1.25rem)] font-semibold leading-[1.5] tracking-[-0.015em]"
        >
          {event.venue}
          <br />
          {event.dates}
        </Reveal>

        <Reveal
          delay={480}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <LinkButton
            href="/photos/call-for-papers-poster.jpg"
            className="!rounded-lg font-bold uppercase tracking-wider"
          >
            Call for Papers
          </LinkButton>
        </Reveal>
      </Container>
    </section>
  );
}
