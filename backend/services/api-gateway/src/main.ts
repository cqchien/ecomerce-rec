import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { PORT, CORS_CONFIG, REQUEST_LIMITS } from './common/constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security middleware
  app.use(helmet());

  // Enable CORS
  app.enableCors({
    origin: CORS_CONFIG.ORIGIN,
    credentials: CORS_CONFIG.CREDENTIALS,
    methods: CORS_CONFIG.METHODS as unknown as string[],
    allowedHeaders: CORS_CONFIG.ALLOWED_HEADERS as unknown as string[],
    exposedHeaders: CORS_CONFIG.EXPOSED_HEADERS as unknown as string[],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Set request size limits
  app.use(require('express').json({ limit: REQUEST_LIMITS.JSON_PAYLOAD }));
  app.use(require('express').urlencoded({ extended: true, limit: REQUEST_LIMITS.URL_ENCODED }));

  // Global prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || PORT.HTTP;
  await app.listen(port);

  const logData = {
    time: new Date().toISOString(),
    level: 'INFO',
    msg: 'API Gateway started successfully',
    service: 'api-gateway',
    port: port,
    endpoints: {
      base: `/api`,
      health: `/api/health`,
      auth: `/api/auth/*`
    }
  };
  console.log(JSON.stringify(logData));
}

bootstrap();
