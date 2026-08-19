import { ImportantDates } from "@/components/site/important-dates";
import { Container } from "@/components/site/ui";
import { event } from "@/content/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Important Dates",
  description: `Key deadlines for ${event.shortName} ${event.edition}: full-paper submission 15 September 2026, notification of acceptance 15 October 2026, early-bird registration 1 November 2026, camera-ready 20 November 2026, seminar ${event.dates}.`,
  path: "/important-dates",
});

export default function ImportantDatesPage() {
  return (
    <div className="surface-light flex-1 bg-mist">
      <Container className="py-16 md:py-20">
        {/* No page header; just the heading, then the dates. */}
        <ImportantDates />
      </Container>
    </div>
  );
}
