import type { ThrottlerModuleOptions } from '@nestjs/throttler';

/**
 * Three named buckets, all evaluated on every request.
 *
 *   short  — burst control, 20 requests / 10s      (counted per route)
 *   medium — sustained browsing, 120 / minute      (counted per route)
 *   long   — API-wide ceiling, 1000 / 15 minutes   (counted per client)
 *
 * `short` and `medium` are counted per route, which is what makes them useful
 * as burst control on one expensive handler. On its own that leaves a hole: a
 * caller who exhausts a route just moves to the next one and starts from zero.
 * `long` closes it -- ThrottlerBehindProxyGuard keys it on the client alone, so
 * it is a single budget spanning every endpoint, and a route that narrows only
 * `short`/`medium` still spends it.
 *
 * Sensitive routes narrow this further with @Throttle(); see AUTH_THROTTLE.
 *
 * Counters live in memory, so they are per Node process. Passenger may run
 * several, and the effective limit is multiplied by however many are up. That
 * is fine for the ceilings here; if this ever needs to be exact, swap in the
 * Redis storage provider rather than lowering the numbers.
 */
export const THROTTLER_CONFIG: ThrottlerModuleOptions = {
  throttlers: [
    { name: 'short', ttl: 10_000, limit: 20 },
    { name: 'medium', ttl: 60_000, limit: 120 },
    { name: 'long', ttl: 900_000, limit: 1000 },
  ],
};

/**
 * Credential endpoints: 5 attempts per minute, 30 per 15 minutes, per IP.
 * Slow enough that online password guessing is useless, loose enough that a
 * person fat-fingering their password twice is never locked out.
 */
export const AUTH_THROTTLE = {
  short: { ttl: 60_000, limit: 5 },
  medium: { ttl: 900_000, limit: 30 },
} as const;

/**
 * Endpoints that cause an email to be sent on behalf of an unauthenticated
 * caller. The cost of abuse here is real money and a burnt sending-domain
 * reputation, so it is the tightest bucket we have.
 */
export const EMAIL_THROTTLE = {
  short: { ttl: 300_000, limit: 3 },
  medium: { ttl: 3_600_000, limit: 10 },
} as const;

/**
 * Token-redemption endpoints. The tokens are 32 random bytes, so this is not
 * what stops a brute force; it stops the database being hammered for free.
 */
export const TOKEN_THROTTLE = {
  short: { ttl: 60_000, limit: 10 },
  medium: { ttl: 900_000, limit: 40 },
} as const;

/**
 * Midtrans retries a failed notification for hours, and a busy settlement batch
 * can arrive in a clump, so this ceiling is high. It exists to bound the damage
 * if the endpoint is discovered and flooded, not to shape normal traffic.
 */
export const WEBHOOK_THROTTLE = {
  short: { ttl: 60_000, limit: 300 },
  medium: { ttl: 60_000, limit: 300 },
  long: { ttl: 900_000, limit: 3000 },
} as const;

/**
 * Routes that ask Midtrans to open a Snap transaction. Each call is an outbound
 * request to the payment provider on our API key, and `POST /registrations`
 * also sends an invoice email, so the loose global ceiling is the wrong shape
 * here: a create/cancel/create loop would bill us for both. Generous enough for
 * someone genuinely changing their mind about a tier.
 */
export const PAYMENT_THROTTLE = {
  short: { ttl: 60_000, limit: 5 },
  medium: { ttl: 900_000, limit: 20 },
} as const;
