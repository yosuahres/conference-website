import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

@Controller()
export class HealthController {
  /**
   * Exempt from the global throttler. This is what the cPanel uptime check and
   * Passenger poll, often on a tight interval and always from the same address,
   * and a 429 here reads as an outage that is not happening. It touches no
   * database and returns a constant, so there is nothing to protect.
   *
   * The throttlers have to be named. A bare @SkipThrottle() writes its flag
   * under 'default', which is a bucket this app does not define, so it would
   * silently skip nothing.
   */
  @Get()
  @SkipThrottle({ short: true, medium: true, long: true })
  health() {
    return true;
  }
}
