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
    methods: CORS_CONFIG.METHODS,
    allowedHeaders: CORS_CONFIG.ALLOWED_HEADERS,
    exposedHeaders: CORS_CONFIG.EXPOSED_HEADERS,
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

  console.log(`🚀 API Gateway is running on: http://localhost:${port}/api`);
  console.log(`📋 Health check: http://localhost:${port}/api/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${port}/api/auth/*`);
}

bootstrap();
