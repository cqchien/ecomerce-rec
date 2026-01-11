import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { PORT } from './common/constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
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

  // Global prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || PORT.HTTP;
  await app.listen(port);

  console.log(`🚀 Notification Service is running on: http://localhost:${port}/api`);
  console.log(`📋 Health check: http://localhost:${port}/api/health`);
  console.log(`📧 Email Provider: SendGrid`);
  console.log(`📱 SMS Provider: Twilio`);
  console.log(`🔔 Push Provider: Firebase`);
  console.log(`📡 Kafka brokers: ${process.env.KAFKA_BROKERS || 'localhost:9092'}`);
}

bootstrap();
