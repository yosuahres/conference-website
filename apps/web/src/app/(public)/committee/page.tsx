import { Container } from "@/components/site/ui";
import { committee, event } from "@/content/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Committee",
  description: `Patronage, advisory board, technical program committee and organizing committee of ${event.shortName} ${event.edition}.`,
  path: "/committee",
});

function Label({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-[1.05rem] font-semibold tracking-[-0.02em]">
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
 * A role and the person holding it. The label column is fixed so that the
 * names line up down the page, and collapses on narrow screens where there is
 * no room for two columns.
 */
function Role({ role, name }: { role: string; name: string }) {
  return (
    <div className="grid gap-x-3 text-[0.925rem] leading-[1.7] sm:grid-cols-[8.5rem_1fr]">
      <dt className="font-semibold">{role}</dt>
      <dd className="text-ink">{name}</dd>
    </div>
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
            <dl className="mt-3">
              <Role role="Chair" name={board.chair} />
            </dl>
            <h3 className="mt-4 text-[0.925rem] font-semibold leading-[1.7]">
              Members
            </h3>
            <People names={board.members} />
          </section>
        ))}

        {/* Organizing committee */}
        <section className="mt-7">
          <Label>{organizing.heading}</Label>
          <dl className="mt-3 grid gap-y-1.5">
            {organizing.roles.map((entry) => (
              <Role key={entry.role} role={entry.role} name={entry.name} />
            ))}
          </dl>
        </section>

        {/* The working groups are short enough to pair up on a wide screen,
            which keeps the page from becoming a single long column of
            two-line sections. */}
        <div className="mt-7 grid gap-7 sm:grid-cols-2">
          {workingGroups.map((group) => (
            <section key={group.heading}>
              <h3 className="font-display text-[0.975rem] font-semibold tracking-[-0.02em]">
                {group.heading}
              </h3>
              {group.chair ? (
                <dl className="mt-2">
                  <Role role="Chair" name={group.chair} />
                </dl>
              ) : null}
              <People names={group.members} />
            </section>
          ))}
        </div>
      </Container>
    </div>
  );
}
