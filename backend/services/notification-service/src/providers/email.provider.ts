import { Injectable } from '@nestjs/common';
import sgMail from '@sendgrid/mail';
import { ConfigService } from '@nestjs/config';
import { PROVIDERS, ERRORS } from '../common/constants';

@Injectable()
export class EmailProvider {
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    }
    this.fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL');
    this.fromName = this.configService.get<string>('SENDGRID_FROM_NAME');
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<{ messageId: string; provider: string }> {
    try {
      const msg = {
        to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject,
        html,
        text: text || this.stripHtml(html),
      };

      const [response] = await sgMail.send(msg);

      return {
        messageId: response.headers['x-message-id'] as string,
        provider: PROVIDERS.SENDGRID,
      };
    } catch (error) {
      throw new Error(`${ERRORS.PROVIDER_ERROR}: ${error.message}`);
    }
  }

  async sendBulkEmail(
    recipients: Array<{ to: string; subject: string; html: string; text?: string }>,
  ): Promise<Array<{ messageId: string; provider: string }>> {
    try {
      const messages = recipients.map((recipient) => ({
        to: recipient.to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: recipient.subject,
        html: recipient.html,
        text: recipient.text || this.stripHtml(recipient.html),
      }));

      const responses = await sgMail.send(messages);

      return responses.map((response) => ({
        messageId: response[0].headers['x-message-id'] as string,
        provider: PROVIDERS.SENDGRID,
      }));
    } catch (error) {
      throw new Error(`${ERRORS.PROVIDER_ERROR}: ${error.message}`);
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }
}
