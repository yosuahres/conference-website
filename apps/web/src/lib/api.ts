import type {
  Conference,
  ContentPage,
  NavPage,
  PaymentHandoff,
  PublicUser,
  RegistrationDetail,
  RegistrationListItem,
  RegistrationStats,
  RegistrationTier,
  ScheduleDay,
  Speaker,
  SubmissionDetail,
  SubmissionListItem,
  Track,
} from "@shared/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Server components must forward the incoming cookie header themselves. */
  cookieHeader?: string;
}

/**
 * The one place `web` talks to `api`. Cookies carry the session in both
 * directions, so every call is credentialed — there is no token to juggle.
 */
async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, cookieHeader, headers, ...rest } = options;

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    credentials: "include",
    // Session-dependent data must never be served from a cache.
    cache: "no-store",
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    // Nest's ValidationPipe returns `message` as an array of field errors.
    const raw = (payload as { message?: string | string[] } | null)?.message;
    const fallback = `Request failed with ${response.status}`;
    // An empty array is possible, so index access needs its own fallback.
    const message = Array.isArray(raw)
      ? (raw[0] ?? fallback)
      : (raw ?? fallback);
    throw new ApiError(response.status, message, groupFieldErrors(raw));
  }

  return payload as T;
}

/** Turns Nest's flat "property must be …" strings into per-field messages. */
function groupFieldErrors(raw: string | string[] | undefined) {
  if (!Array.isArray(raw)) return undefined;
  const grouped: Record<string, string[]> = {};
  for (const message of raw) {
    const field = message.split(" ")[0] ?? "form";
    (grouped[field] ??= []).push(message);
  }
  return grouped;
}

export const api = {
  auth: {
    register: (body: {
      email: string;
      password: string;
      name: string;
      affiliation?: string;
    }) => request<PublicUser>("/auth/register", { method: "POST", body }),

    login: (body: { email: string; password: string }) =>
      request<PublicUser>("/auth/login", { method: "POST", body }),

    logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),

    me: (cookieHeader?: string) =>
      request<PublicUser>("/auth/me", { cookieHeader }),

    verifyEmail: (token: string) =>
      request<PublicUser>("/auth/verify-email", {
        method: "POST",
        body: { token },
      }),

    forgotPassword: (email: string) =>
      request<{ ok: boolean }>("/auth/forgot-password", {
        method: "POST",
        body: { email },
      }),

    resetPassword: (token: string, password: string) =>
      request<{ ok: boolean }>("/auth/reset-password", {
        method: "POST",
        body: { token, password },
      }),
  },

  conference: {
    active: () => request<Conference>("/conference"),
    tracks: () => request<Track[]>("/conference/tracks"),
    speakers: () => request<Speaker[]>("/conference/speakers"),
    schedule: () => request<ScheduleDay[]>("/conference/schedule"),
    nav: () => request<NavPage[]>("/conference/nav"),
    page: (slug: string) =>
      request<ContentPage>(`/conference/pages/${encodeURIComponent(slug)}`),
  },

  submissions: {
    listMine: (cookieHeader?: string) =>
      request<SubmissionListItem[]>("/submissions", { cookieHeader }),

    registerable: (cookieHeader?: string) =>
      request<{ id: number; reference: string; title: string }[]>(
        "/submissions/registerable",
        { cookieHeader },
      ),

    get: (id: number, cookieHeader?: string) =>
      request<SubmissionDetail>(`/submissions/${id}`, { cookieHeader }),

    listAll: (status?: string, cookieHeader?: string) =>
      request<SubmissionListItem[]>(
        `/submissions/admin/all${status ? `?status=${status}` : ""}`,
        { cookieHeader },
      ),

    create: (body: unknown) =>
      request<{ id: number }>("/submissions", { method: "POST", body }),

    update: (id: number, body: unknown) =>
      request<{ id: number }>(`/submissions/${id}`, { method: "PUT", body }),

    requestUpload: (id: number, body: unknown) =>
      request<{ uploadUrl: string; storageKey: string; version: number }>(
        `/submissions/${id}/uploads`,
        { method: "POST", body },
      ),

    confirmUpload: (id: number, body: unknown) =>
      request<{ ok: boolean }>(`/submissions/${id}/uploads/confirm`, {
        method: "POST",
        body,
      }),

    submit: (id: number) =>
      request<{ ok: boolean }>(`/submissions/${id}/submit`, { method: "POST" }),

    withdraw: (id: number) =>
      request<{ ok: boolean }>(`/submissions/${id}/withdraw`, {
        method: "POST",
      }),

    recordDecision: (id: number, body: unknown) =>
      request<{ ok: boolean }>(`/submissions/${id}/decision`, {
        method: "POST",
        body,
      }),

    assignReviewer: (id: number, body: unknown) =>
      request<{ ok: boolean }>(`/submissions/${id}/reviewers`, {
        method: "POST",
        body,
      }),

    saveReview: (id: number, body: unknown) =>
      request<{ ok: boolean }>(`/submissions/${id}/review`, {
        method: "POST",
        body,
      }),

    downloadUrl: (fileId: number) =>
      request<{ url: string }>(`/submissions/files/${fileId}/download`),
  },

  registrations: {
    tiers: () => request<RegistrationTier[]>("/registrations/tiers"),

    listMine: (cookieHeader?: string) =>
      request<RegistrationListItem[]>("/registrations", { cookieHeader }),

    get: (id: number, cookieHeader?: string) =>
      request<RegistrationDetail>(`/registrations/${id}`, { cookieHeader }),

    create: (body: unknown) =>
      request<PaymentHandoff>("/registrations", { method: "POST", body }),

    retryPayment: (id: number) =>
      request<PaymentHandoff>(`/registrations/${id}/pay`, { method: "POST" }),

    cancel: (id: number) =>
      request<{ ok: boolean }>(`/registrations/${id}/cancel`, {
        method: "POST",
      }),

    listAll: (cookieHeader?: string) =>
      request<RegistrationListItem[]>("/registrations/admin/all", {
        cookieHeader,
      }),

    stats: (cookieHeader?: string) =>
      request<RegistrationStats>("/registrations/stats", { cookieHeader }),
  },

  users: {
    list: (cookieHeader?: string) =>
      request<PublicUser[]>("/users", { cookieHeader }),

    updateProfile: (body: unknown) =>
      request<PublicUser>("/users/me", { method: "PATCH", body }),

    setRole: (id: number, role: string) =>
      request<PublicUser>(`/users/${id}/role`, {
        method: "PATCH",
        body: { role },
      }),
  },
};

export { request as apiRequest };
