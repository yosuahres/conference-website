import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/site/ui";
import { Icon } from "@/components/site/icon";
import { event, submissionInfo, templateDownloads } from "@/content/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Submission",
  description: `Submit a 2 to 6 page full paper to ${event.shortName} ${event.edition} by 15 September 2026. Double-blind review, with accepted and presented papers published in the Proceedings of SPIE and indexed in Scopus.`,
  path: "/submission",
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

const linkClass =
  "font-medium text-beam underline decoration-beam/30 underline-offset-4 transition-colors hover:decoration-beam";

function FileLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={linkClass}
    >
      {label}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export default function SubmissionPage() {
  const { publication, plagiarism, instructions, templates, method } =
    submissionInfo;

  return (
    <div className="surface-light flex-1 bg-mist">
      <Container className="py-8 md:py-10">
        {/* Paper Publication */}
        <section>
          <Label>{publication.heading}</Label>
          <Body>{publication.lead}</Body>

          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-line bg-shell p-4 sm:flex-row sm:items-center sm:gap-5 sm:px-5">
            <Image
              src="/brand/spie.png"
              alt="SPIE"
              width={474}
              height={94}
              sizes="132px"
              className="h-8 w-auto shrink-0 mix-blend-multiply"
            />
            <div>
              <p className="text-[0.925rem] font-medium leading-[1.6]">
                {publication.proceedings}
              </p>
              <p className="mt-1 text-[0.85rem] leading-[1.65] text-ink">
                {publication.indexing}
              </p>
            </div>
          </div>

          <ul className="mt-3 grid gap-y-1.5">
            {publication.points.map((point) => (
              <Bullet key={point}>{point}</Bullet>
            ))}
          </ul>
        </section>

        {/* Policy on Plagiarism */}
        <section className="mt-7">
          <Label>{plagiarism.heading}</Label>
          <Body>{plagiarism.body}</Body>
        </section>

        {/* Instruction to Authors */}
        <section className="mt-7">
          <Label>{instructions.heading}</Label>
          <Body>{instructions.body}</Body>
        </section>

        {/* Paper Template */}
        <section className="mt-7">
          <Label>{templates.heading}</Label>
          <Body>{templates.lead}</Body>

          <ul className="mt-3 flex flex-wrap gap-x-8 gap-y-3">
            {templateDownloads.map((doc) => (
              <li
                key={doc.label}
                className="flex items-center gap-2 text-[0.925rem] leading-[1.7]"
              >
                <span aria-hidden className="text-faint">
                  <Icon name="download" className="size-[17px]" />
                </span>
                <span>
                  {doc.label} (
                  {doc.files.map((file, i) => (
                    <span key={file.href}>
                      {i > 0 ? ", " : null}
                      <FileLink href={file.href} label={file.format} />
                    </span>
                  ))}
                  )
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Submission Methods */}
        <section className="mt-7">
          <Label>{method.heading}</Label>
          <Body>{method.intro}</Body>

          <ol className="mt-3 grid gap-y-1.5">
            {method.options.map((option) => (
              <li
                key={option.n}
                className="text-[0.925rem] leading-[1.7] text-ink"
              >
                {option.n}.{" "}
                {option.href.startsWith("/") ? (
                  <Link href={option.href} className={linkClass}>
                    {option.label}
                  </Link>
                ) : (
                  <a href={option.href} className={linkClass}>
                    {option.label}
                  </a>
                )}{" "}
                ({option.formats}){option.note ? ` (${option.note}).` : null}
              </li>
            ))}
          </ol>

          <p className="mt-3 text-[0.925rem] leading-[1.7] text-ink">
            {method.paperId} {method.enquiries}{" "}
            <a href={`mailto:${event.email}`} className={linkClass}>
              {event.email}
            </a>
            .
          </p>
        </section>
      </Container>
    </div>
  );
}
