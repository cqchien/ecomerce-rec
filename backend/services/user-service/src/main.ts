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

  const port = process.env.HTTP_PORT || DEFAULT_HTTP_PORT;
  await app.listen(port);

  const logData = {
    time: new Date().toISOString(),
    level: 'INFO',
    msg: 'User Service started successfully',
    service: 'user-service',
    http_port: port,
    grpc_port: process.env.GRPC_PORT || '5001',
    health: `/health`
  };
  console.log(JSON.stringify(logData));
}

bootstrap();
