import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);

  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('api');
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
