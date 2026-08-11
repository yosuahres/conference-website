import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import type { PublicUser, UserRole } from "@shared/types";
import { api, ApiError } from "./api";

/**
 * Server components run on the Node side, where `fetch` has no browser cookie
 * jar — the incoming request's cookie header has to be forwarded by hand. This
 * grabs it once per request.
 */
export const forwardedCookies = cache(async () => {
  const requestHeaders = await headers();
  return requestHeaders.get("cookie") ?? "";
});

/** Cached per request, so a layout, a page and a component share one call. */
export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  try {
    return await api.auth.me(await forwardedCookies());
  } catch (cause) {
    // 401 just means "not signed in" — anything else is a real failure.
    if (cause instanceof ApiError && cause.status === 401) return null;
    throw cause;
  }
});

export async function requireUser(returnTo?: string): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) {
    const next = returnTo ? `?next=${encodeURIComponent(returnTo)}` : "";
    redirect(`/sign-in${next}`);
  }
  return user;
}

export async function requireRole(...roles: UserRole[]): Promise<PublicUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}

export const requireAdmin = () => requireRole("admin");
export const requireReviewer = () => requireRole("reviewer", "admin");

/** The active conference, or null when none is configured yet. */
export const getActiveConference = cache(async () => {
  try {
    return await api.conference.active();
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 404) return null;
    throw cause;
  }
});
