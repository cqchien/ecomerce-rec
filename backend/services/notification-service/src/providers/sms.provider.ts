import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { PROVIDERS, ERRORS } from '../common/constants';

@Injectable()
export class SmsProvider {
  private readonly client: Twilio;
  private readonly phoneNumber: string;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

    if (accountSid && authToken) {
      this.client = new Twilio(accountSid, authToken);
    }

    this.phoneNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');
  }

  async sendSms(
    to: string,
    message: string,
  ): Promise<{ messageId: string; provider: string }> {
    try {
      if (!this.client) {
        throw new Error('Twilio client not initialized');
      }

      const response = await this.client.messages.create({
        body: message,
        from: this.phoneNumber,
        to,
      });

      return {
        messageId: response.sid,
        provider: PROVIDERS.TWILIO,
      };
    } catch (error) {
      throw new Error(`${ERRORS.PROVIDER_ERROR}: ${error.message}`);
    }
  }

  async sendBulkSms(
    recipients: Array<{ to: string; message: string }>,
  ): Promise<Array<{ messageId: string; provider: string }>> {
    try {
      const promises = recipients.map((recipient) =>
        this.sendSms(recipient.to, recipient.message),
      );

      return Promise.all(promises);
    } catch (error) {
      throw new Error(`${ERRORS.PROVIDER_ERROR}: ${error.message}`);
    }
  }

  validatePhoneNumber(phoneNumber: string): boolean {
    // Basic E.164 format validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }
}
