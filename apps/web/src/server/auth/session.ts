import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/server/auth";
import type { UserRole } from "@/server/db/schema";

/**
 * Cached per request so a page that checks auth in the layout, the page and two
 * server actions still hits the session store once.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export async function requireUser(returnTo?: string) {
  const user = await getCurrentUser();
  if (!user) {
    const next = returnTo ? `?next=${encodeURIComponent(returnTo)}` : "";
    redirect(`/sign-in${next}`);
  }
  return user;
}

export async function requireRole(...roles: UserRole[]) {
  const user = await requireUser();
  if (!roles.includes(user.role as UserRole)) {
    redirect("/dashboard");
  }
  return user;
}

export const requireAdmin = () => requireRole("admin");
export const requireReviewer = () => requireRole("reviewer", "admin");
