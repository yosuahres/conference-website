import { Container } from "@/components/site/ui";
import { event, tracks } from "@/content/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Call for Papers",
  description: `Topics of interest for ${event.shortName} ${event.edition}: ${tracks
    .map((track) => track.title)
    .join(", ")}.`,
  path: "/call-for-papers",
});

function Label({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-[1.05rem] font-semibold tracking-[-0.02em]">
      {children}
    </h2>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 text-[0.925rem] leading-[1.7] text-ink">{children}</p>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[0.9rem_1fr] gap-x-2 text-[0.925rem] leading-[1.7] text-ink">
      <span aria-hidden className="pt-[0.55em] text-faint">
        <span className="block size-[5px] rounded-full bg-current" />
      </span>
      <span>{children}</span>
    </li>
  );
}

export default function CallForPapersPage() {
  return (
    <div className="surface-light flex-1 bg-mist">
      <Container className="py-8 md:py-10">
        <section>
          <Label>Topics of Interest</Label>
          <Body>
            {event.shortName} {event.edition} welcomes original and unpublished
            research on light-based technology. Submissions are invited in, but
            not limited to, the following topics.
          </Body>

          <ul className="mt-3 grid gap-y-1.5">
            {tracks.map((track) => (
              <Bullet key={track.n}>
                <span className="font-semibold">{track.title}</span>
                {track.desc ? ` ${track.desc}` : null}
              </Bullet>
            ))}
          </ul>
        </section>
      </Container>
    </div>
  );
}
