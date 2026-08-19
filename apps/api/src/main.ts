import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const configService = app.get(ConfigService);
  const isProduction = configService.get('NODE_ENV') === 'production';

  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('api');

  // How many proxies sit in front of us, counted from the app outwards. On the
  // cPanel plan that is Passenger alone (1); put Cloudflare in front and it
  // becomes 2. It must be a count, never `true`: `true` makes Express believe
  // the left-most X-Forwarded-For entry, which the caller writes, and the rate
  // limiter would then be trivially bypassed by rotating a header.
  //
  // parseInt is not decoration. ConfigService returns env values as strings,
  // and Express reads a string setting as a list of trusted IP *addresses* --
  // so passing "1" through matches no address, silently disables the setting,
  // and keys every visitor behind the proxy to the same rate-limit bucket.
  const trustedProxyHops = Number.parseInt(
    configService.get<string>('TRUSTED_PROXY_HOPS', '1'),
    10,
  );
  app.set(
    'trust proxy',
    Number.isFinite(trustedProxyHops) && trustedProxyHops >= 0
      ? trustedProxyHops
      : 1,
  );

  app.use(
    helmet({
      // The API serves JSON to a separate origin; a CSP here protects nothing
      // and only risks breaking the OAuth redirect responses.
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'same-site' },
      // Nothing this API returns should ever render in a frame.
      frameguard: { action: 'deny' },
      referrerPolicy: { policy: 'no-referrer' },
      // Only meaningful over TLS, and switching it on in development would pin
      // localhost to https in the developer's browser for a year.
      hsts: isProduction
        ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
        : false,
    }),
  );

  // Nothing this API accepts is legitimately large: the manuscripts go straight
  // to S3 through a presigned URL and never touch this process. This reconfigures
  // the parser Nest already installed rather than stacking a second one in front
  // of it, so the limit is the one that actually applies.
  app.useBodyParser('json', { limit: '100kb' });
  app.useBodyParser('urlencoded', { extended: true, limit: '100kb' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.use(cookieParser());

  app.enableCors({
    origin: configService.getOrThrow<string>('WEB_APP_URL'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86_400,
  });

  const port = configService.get<number>('PORT', 3333);
  await app.listen(port);
  return port;
}

bootstrap()
  .then((port) => console.log(`API listening on http://localhost:${port}/api`))
  .catch((error) => {
    console.error('Failed to start API', error);
    process.exit(1);
  });
