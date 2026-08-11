import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: false });

/**
 * Page bodies are written by the organising committee through the admin, so the
 * trust boundary is "staff-authored", the same as a template file. If page
 * editing is ever opened up beyond admins, sanitise the output here.
 */
export function renderMarkdown(source: string): string {
  return marked.parse(source, { async: false });
}
