import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from './infrastructure/redis.module';

// Entities
import { Notification } from './entities/notification.entity';
import { UserPreference } from './entities/user-preference.entity';
import { NotificationTemplate } from './entities/notification-template.entity';

// Services
import { NotificationService } from './services/notification.service';
import { UserPreferenceService } from './services/user-preference.service';
import { TemplateService } from './services/template.service';
import { EventConsumerService } from './services/event-consumer.service';
import { NotificationSenderService } from './services/notification-sender.service';

// Providers
import { EmailProvider } from './providers/email.provider';
import { SmsProvider } from './providers/sms.provider';
import { PushProvider } from './providers/push.provider';

// Controllers
import { NotificationController } from './controllers/notification.controller';
import { PreferenceController } from './controllers/preference.controller';
import { HealthController } from './controllers/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [Notification, UserPreference, NotificationTemplate],
        synchronize: true, // Set to false in production
        logging: false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Notification, UserPreference, NotificationTemplate]),
    ScheduleModule.forRoot(),
    RedisModule,
  ],
  controllers: [NotificationController, PreferenceController, HealthController],
  providers: [
    NotificationService,
    UserPreferenceService,
    TemplateService,
    EventConsumerService,
    NotificationSenderService,
    EmailProvider,
    SmsProvider,
    PushProvider,
  ],
})
export class AppModule {}
