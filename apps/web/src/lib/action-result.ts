import type { ZodError } from "zod";

/**
 * Server actions return this instead of throwing. A thrown error in production
 * reaches the client as an opaque digest, which is useless for form feedback.
 */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export function ok(): ActionResult<void>;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

export function fail(
  error: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/** Flattens a Zod error into the `{ field: messages }` shape forms expect. */
export function fieldErrorsOf(error: ZodError): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const issue of error.issues) {
    // Nested paths ("authors.0.email") collapse to their root field, which is
    // where the form renders the message.
    const key = String(issue.path[0] ?? "form");
    (result[key] ??= []).push(issue.message);
  }
  return result;
}

/** Wraps an action body so an unexpected throw becomes a readable message. */
export async function attempt<T>(
  fn: () => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (cause) {
    // `redirect()` and `notFound()` work by throwing — let those through.
    if (
      cause &&
      typeof cause === "object" &&
      "digest" in cause &&
      typeof cause.digest === "string" &&
      cause.digest.startsWith("NEXT_")
    ) {
      throw cause;
    }
    console.error("[action]", cause);
    return fail(
      cause instanceof Error ? cause.message : "Something went wrong.",
    );
  }
}
