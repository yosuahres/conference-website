import { event } from "@/content/site";
import { isSubmissionOpen } from "@/lib/site-dates";
import { SiteHeaderShell } from "./site/site-header-shell";

export function SiteHeader() {
  return (
    <SiteHeaderShell
      wordmark={event.shortName}
      edition={event.edition}
      submissionOpen={isSubmissionOpen()}
    />
  );
}
