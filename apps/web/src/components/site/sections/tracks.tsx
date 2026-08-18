import { tracks } from "@/content/site";
import { Container, Section } from "../ui";

export function Tracks() {
  return (
    <Section id="tracks" className="!bg-mist">
      <Container>
        <h2 className="text-center font-display text-[clamp(1.75rem,4vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.03em]">
          Seminar Topics
        </h2>
        <div className="rule mx-auto mt-7 w-40" />

        <ul className="mx-auto mt-16 grid max-w-5xl justify-center gap-x-14 gap-y-10 md:auto-cols-max md:grid-flow-col md:grid-rows-4">
          {tracks.map((track) => (
            <li key={track.n} className="flex items-start gap-7">
              <span
                aria-hidden
                className="flex size-14 shrink-0 items-center justify-center rounded-full bg-beam font-display text-[1.6rem] font-bold text-paper"
              >
                {Number(track.n)}
              </span>

              <div className="max-w-sm">
                <h3 className="text-[1.15rem] font-semibold leading-[1.5]">
                  {track.title}
                </h3>
                <p className="mt-1.5 text-[0.95rem] leading-[1.65] text-subtle">
                  {track.desc}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
