import { Container } from "@/components/site/ui";
import { committee, event } from "@/content/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Committee",
  description: `Patronage, advisory board, technical program committee and organizing committee of ${event.shortName} ${event.edition}.`,
  path: "/committee",
});

/**
 * The horizontal accent rule marking the start of a section.
 *
 * From `md` it is taken out of flow and hung in the container's left padding,
 * so the heading itself starts on the same left edge as the lists beneath it
 * rather than being pushed in by the width of its own marker. Below `md` it
 * stays inline: Container drops to `px-6`, and 24px is not enough room to park
 * a rule in without it running off the side of the screen.
 */
function Marker({ tone = "strong" }: { tone?: "strong" | "soft" }) {
  // Whole class strings per tone rather than overrides appended to a base:
  // `bg-beam` and `bg-beam/55` in one attribute would leave the winner up to
  // the order Tailwind happened to emit them in.
  const hang =
    "md:absolute md:right-full md:top-1/2 md:mr-3 md:-translate-y-1/2";

  return (
    <span
      aria-hidden
      className={
        tone === "strong"
          ? `h-[6px] w-[1.5rem] shrink-0 bg-beam ${hang}`
          : `h-[5px] w-[1.1rem] shrink-0 bg-beam/55 ${hang}`
      }
    />
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="relative flex items-center gap-3 font-display text-[1.2rem] font-semibold tracking-[-0.02em]">
      <Marker />
      {children}
    </h2>
  );
}

/**
 * A numbered list of people. The number is aria-hidden because the <ol> already
 * tells a screen reader the position, and reading "one, one, Prof..." is worse
 * than reading the name. `tabular-nums` and the right-aligned column keep the
 * names on one left edge once the count passes nine, which it does: the
 * technical program committee runs to thirty-two.
 */
function People({ names }: { names: readonly string[] }) {
  return (
    <ol className="mt-3 grid gap-y-1.5">
      {names.map((name, i) => (
        <li
          key={name}
          className="grid grid-cols-[1.5rem_1fr] gap-x-2 text-[0.925rem] leading-[1.7] text-ink"
        >
          <span aria-hidden className="text-right tabular-nums text-faint">
            {i + 1}.
          </span>
          <span>{name}</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Rows of a <Roles> list. Deliberately bare dt/dd rather than a wrapper: the
 * grid lives on the parent, so the label column sizes itself to the longest
 * label present and every name in the list still lines up.
 */
function Role({ role, name }: { role: string; name: string }) {
  return (
    <>
      <dt className="font-semibold">{role}</dt>
      <dd className="text-ink">{name}</dd>
    </>
  );
}

/**
 * Two columns from `sm` up, stacked below it, where a long name beside its
 * label would leave too little room to read.
 */
function Roles({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <dl
      className={`grid gap-y-1.5 text-[0.925rem] leading-[1.7] sm:grid-cols-[auto_1fr] sm:gap-x-6 ${className}`}
    >
      {children}
    </dl>
  );
}

export default function CommitteePage() {
  const { patronage, boards, organizing, workingGroups } = committee;

  return (
    <div className="surface-light flex-1 bg-mist">
      <Container className="py-8 md:py-10">
        {/* Patronage */}
        <section>
          <Label>{patronage.heading}</Label>
          <People names={patronage.entries} />
        </section>

        {/* Advisory and technical program committees */}
        {boards.map((board) => (
          <section key={board.heading} className="mt-7">
            <Label>{board.heading}</Label>
            <Roles className="mt-3">
              <Role role="Chair" name={board.chair} />
            </Roles>
            <h3 className="mt-4 text-[0.925rem] font-semibold leading-[1.7]">
              Members
            </h3>
            <People names={board.members} />
          </section>
        ))}

        {/* Organizing committee */}
        <section className="mt-7">
          <Label>{organizing.heading}</Label>
          <Roles className="mt-3">
            {organizing.roles.map((entry) => (
              <Role key={entry.role} role={entry.role} name={entry.name} />
            ))}
          </Roles>
        </section>

        {/* One column, in the order the secretariat listed them. Pairing them
            up saves height but costs the reader the running order, and the
            page is a reference rather than something anyone reads through. */}
        <div className="mt-7 grid gap-y-7">
          {workingGroups.map((group) => (
            <section key={group.heading}>
              {/* A step down from Label: the bar is narrower and dimmer so the
                  working groups still read as sitting under the committees
                  above them, not alongside them. */}
              <h3 className="relative flex items-center gap-3 font-display text-[1.05rem] font-semibold tracking-[-0.02em]">
                <Marker tone="soft" />
                {group.heading}
              </h3>
              {group.chair ? (
                <Roles className="mt-2">
                  <Role role="Chair" name={group.chair} />
                </Roles>
              ) : null}
              <People names={group.members} />
            </section>
          ))}
        </div>
      </Container>
    </div>
  );
}
