import { tracks } from "@/content/site";
import { Reveal } from "../reveal";
import { Container, Section } from "../ui";

export function Tracks() {
  return (
    <Section id="tracks" className="!bg-mist">
      <Container>
        <Reveal>
          <h2 className="text-center font-display text-[clamp(1.75rem,4vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.03em]">
            Seminar Topics
          </h2>
          <div className="rule mx-auto mt-4 w-40" />
        </Reveal>

        <ul className="mx-auto mt-14 grid justify-center gap-x-10 gap-y-0 xl:auto-cols-max xl:grid-flow-col xl:grid-rows-4">
          {tracks.map((track, i) => (
            <Reveal
              key={track.n}
              as="li"
              delay={60 * i}
              className="flex items-start gap-3.5"
            >
              <span aria-hidden className="pt-[0.62em] text-navy">
                <span className="block size-[7px] rounded-full bg-current" />
              </span>

              <h3 className="text-[1.15rem] font-semibold leading-[1.45] xl:whitespace-nowrap xl:text-[1.35rem]">
                {track.title}
              </h3>
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
