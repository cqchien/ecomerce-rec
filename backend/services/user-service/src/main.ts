import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure gRPC microservice
  const grpcPort = process.env.GRPC_PORT || '5001';
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'user',
      protoPath: join(__dirname, '../proto/user.proto'),
      url: `0.0.0.0:${grpcPort}`,
    },
  });

  await app.startAllMicroservices();

  const logData = {
    time: new Date().toISOString(),
    level: 'INFO',
    msg: 'User Service started (gRPC only)',
    service: 'user-service',
    grpcPort,
  };
  console.log(JSON.stringify(logData));
}

bootstrap();
