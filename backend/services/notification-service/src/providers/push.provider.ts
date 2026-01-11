import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { PROVIDERS, ERRORS } from '../common/constants';

@Injectable()
export class PushProvider {
  private initialized: boolean = false;

  constructor(private readonly configService: ConfigService) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
      const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

      if (projectId && clientEmail && privateKey) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        });
        this.initialized = true;
      }
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
    }
  }

  async sendPushNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<{ messageId: string; provider: string }> {
    try {
      if (!this.initialized) {
        throw new Error('Firebase not initialized');
      }

      const message: admin.messaging.Message = {
        token,
        notification: {
          title,
          body,
        },
        data: data || {},
      };

      const messageId = await admin.messaging().send(message);

      return {
        messageId,
        provider: PROVIDERS.FIREBASE,
      };
    } catch (error) {
      throw new Error(`${ERRORS.PROVIDER_ERROR}: ${error.message}`);
    }
  }

  async sendMulticastPushNotification(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<{ successCount: number; failureCount: number; provider: string }> {
    try {
      if (!this.initialized) {
        throw new Error('Firebase not initialized');
      }

      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title,
          body,
        },
        data: data || {},
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        provider: PROVIDERS.FIREBASE,
      };
    } catch (error) {
      throw new Error(`${ERRORS.PROVIDER_ERROR}: ${error.message}`);
    }
  }

  async sendTopicNotification(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<{ messageId: string; provider: string }> {
    try {
      if (!this.initialized) {
        throw new Error('Firebase not initialized');
      }

      const message: admin.messaging.Message = {
        topic,
        notification: {
          title,
          body,
        },
        data: data || {},
      };

      const messageId = await admin.messaging().send(message);

      return {
        messageId,
        provider: PROVIDERS.FIREBASE,
      };
    } catch (error) {
      throw new Error(`${ERRORS.PROVIDER_ERROR}: ${error.message}`);
    }
  }
}
