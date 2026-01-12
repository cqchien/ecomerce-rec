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

  const logData = {
    time: new Date().toISOString(),
    level: 'INFO',
    msg: 'Notification Service started successfully',
    service: 'notification-service',
    port: port,
    providers: {
      email: 'SendGrid',
      sms: 'Twilio',
      push: 'Firebase'
    },
    kafka_brokers: process.env.KAFKA_BROKERS || 'localhost:9092'
  };
  console.log(JSON.stringify(logData));
}

bootstrap();
