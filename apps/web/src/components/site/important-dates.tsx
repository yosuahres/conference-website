import { keyDateGroups } from "@/content/site";

export function ImportantDates({ className = "" }: { className?: string }) {
  return (
    <section className={className}>
      {/* Sole heading on /important-dates, so it carries the page's h1. */}
      <h1 className="font-display text-[clamp(1.35rem,2.6vw,1.85rem)] font-semibold tracking-[-0.025em]">
        Important Dates
      </h1>

      <div className="mt-8 grid gap-6 md:grid-cols-2 md:gap-8">
        {keyDateGroups.map((group) => (
          <div
            key={group.heading}
            className="rounded-2xl bg-mist px-5 py-6 md:px-7 md:py-8"
          >
            <p className="eyebrow">{group.heading}</p>
            <table className="mt-5 w-full border-collapse text-[0.95rem]">
              <tbody>
                {group.dates.map((date) => (
                  <tr key={date.n}>
                    <th
                      scope="row"
                      className="w-full border border-line px-4 py-3 text-left font-medium leading-[1.45]"
                    >
                      {date.label}
                    </th>
                    <td className="whitespace-nowrap border border-line px-4 py-3 text-right tabular-nums text-subtle">
                      {date.display}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </section>
  );
}
