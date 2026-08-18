import Image from "next/image";

import { event, hostCity } from "@/content/site";
import { Container } from "../ui";

export function Hero() {
  return (
    <section
      id="home"
      className="relative flex min-h-[62svh] flex-col items-center justify-center pb-32 pt-16 md:pb-36 md:pt-20"
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
          className="object-cover opacity-[0.18]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-deep/80 via-paper/40 to-paper" />
      </div>

      <Container className="relative z-10 text-center">
        <h1 className="font-display text-[clamp(3.5rem,15vw,12.5rem)] font-semibold leading-[0.85] tracking-[-0.05em]">
          {event.shortName}
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-balance text-[clamp(0.95rem,1.6vw,1.15rem)] font-medium leading-[1.4] text-subtle">
          {event.fullName}
        </p>

        <p className="mx-auto mt-8 max-w-3xl text-balance font-display text-[clamp(1.35rem,2.6vw,2rem)] font-semibold leading-[1.2] tracking-[-0.025em] text-beam">
          {event.theme}
        </p>

        <p className="mt-10 font-display text-[clamp(1rem,1.7vw,1.25rem)] font-semibold leading-[1.5] tracking-[-0.015em]">
          {event.city}
          <br />
          {event.venue}
          <br />
          {event.dates}
        </p>
      </Container>
    </section>
  );
}
