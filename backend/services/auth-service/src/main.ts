import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3001;

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN'),
    credentials: true,
  });

  // Graceful shutdown
  app.enableShutdownHooks();

  await app.listen(port);
  
  const logData = {
    time: new Date().toISOString(),
    level: 'INFO',
    msg: 'Auth Service started successfully',
    service: 'auth-service',
    port: port
  };
  console.log(JSON.stringify(logData));
}

bootstrap();
