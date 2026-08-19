import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { createHash } from 'node:crypto';
import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/**
 * The stock guard keys on `req.ip`. Behind cPanel/Passenger (and behind
 * Cloudflare in front of that) every request arrives from the proxy, so the
 * stock guard would put the entire internet in one bucket: the first ten
 * visitors would use up everyone's quota.
 *
 * With `trust proxy` set in main.ts Express fills `req.ips` from
 * X-Forwarded-For, dropping the hops it was told to trust, so `ips[0]` is the
 * closest thing to a real client address we have.
 *
 * X-Forwarded-For is still caller-controlled, so `trust proxy` must be set to
 * the number of proxies actually in front of the app, never to `true`.
 */
@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected async getTracker(request: Request): Promise<string> {
    return request.ips?.length ? request.ips[0] : (request.ip ?? 'unknown');
  }

  /**
   * The stock key is `Class-handler-throttler-client`, so every bucket is
   * per-route: a caller who has exhausted `long` on one endpoint simply moves
   * to the next one and starts from zero, and the API-wide ceiling the config
   * describes would not exist. Dropping the route from the `long` key makes it
   * what it claims to be -- one budget per client across every endpoint --
   * while `short` and `medium` stay per-route, which is what makes them useful
   * as burst control on a single expensive handler.
   *
   * The limit still comes from whichever route is being called, so a route that
   * widens `long` (the Midtrans webhook) raises the ceiling for that caller
   * only while it is calling that route. Midtrans arrives from its own address,
   * so this does not hand a wider budget to anyone else.
   */
  protected generateKey(
    context: ExecutionContext,
    suffix: string,
    name: string,
  ): string {
    const prefix =
      name === 'long'
        ? `global-${name}`
        : `${context.getClass().name}-${context.getHandler().name}-${name}`;

    return createHash('sha256').update(`${prefix}-${suffix}`).digest('hex');
  }
}
