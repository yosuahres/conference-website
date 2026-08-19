import { about } from "@/content/site";
import { Reveal } from "../reveal";
import { Container, Section } from "../ui";

export function About() {
  return (
    <Section id="about" className="!py-14 md:!py-20">
      <Container>
        <Reveal
          as="h2"
          className="text-balance text-center font-display text-[clamp(1.9rem,4.2vw,2.9rem)] font-semibold leading-[1.15] tracking-[-0.03em]"
        >
          {about.heading}
        </Reveal>

        <Reveal
          delay={120}
          className="mt-8 space-y-5 text-[1.02rem] leading-[1.85] text-subtle [hyphens:auto] md:text-justify"
        >
          {about.paragraphs.map((parts, i) => (
            <p key={i}>
              {parts.map((part, j) =>
                typeof part === "string" ? (
                  part
                ) : (
                  <strong key={j} className="font-semibold text-ink">
                    {part.em}
                  </strong>
                ),
              )}
            </p>
          ))}
        </Reveal>
      </Container>
    </Section>
  );
}
