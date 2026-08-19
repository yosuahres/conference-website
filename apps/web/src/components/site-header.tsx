import { event } from "@/content/site";
import { SiteHeaderShell } from "./site/site-header-shell";

export function SiteHeader() {
  return <SiteHeaderShell wordmark={event.shortName} edition={event.edition} />;
}
