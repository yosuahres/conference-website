import { Container } from "@/components/site/ui";
import { committee, event } from "@/content/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Committee",
  description: `Patronage, advisory board, technical program committee and organizing committee of ${event.shortName} ${event.edition}.`,
  path: "/committee",
});

/**
 * The accent bar that marks the start of a section. Sized in `em` so it tracks
 * the heading it sits against rather than needing a value per heading level.
 */
function Marker({ tone = "strong" }: { tone?: "strong" | "soft" }) {
  // Whole class strings per tone rather than overrides appended to a base:
  // `bg-beam` and `bg-beam/55` in one attribute would leave the winner up to
  // the order Tailwind happened to emit them in.
  return (
    <span
      aria-hidden
      className={
        tone === "strong"
          ? "h-[1.7em] w-[4px] shrink-0 bg-beam"
          : "h-[1.5em] w-[3px] shrink-0 bg-beam/55"
      }
    />
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2.5 font-display text-[1.2rem] font-semibold tracking-[-0.02em]">
      <Marker />
      {children}
    </h2>
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

function People({ names }: { names: readonly string[] }) {
  return (
    <ul className="mt-3 grid gap-y-1.5">
      {names.map((name) => (
        <Bullet key={name}>{name}</Bullet>
      ))}
    </ul>
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
              <h3 className="flex items-center gap-2.5 font-display text-[1.05rem] font-semibold tracking-[-0.02em]">
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
