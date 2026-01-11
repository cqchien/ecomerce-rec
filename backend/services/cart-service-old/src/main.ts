import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DEFAULT_HTTP_PORT } from './common/constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS
  app.enableCors();

  // Set global prefix
  app.setGlobalPrefix('api');

  const port = process.env.HTTP_PORT || DEFAULT_HTTP_PORT;
  await app.listen(port);

  console.log(`[Cart Service] HTTP server running on port ${port}`);
  console.log(`[Cart Service] Health check: http://localhost:${port}/health`);
  console.log(`[Cart Service] API: http://localhost:${port}/api`);
}

bootstrap();
