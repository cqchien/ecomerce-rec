import { Controller, Get, Put, Body, Param, ValidationPipe } from '@nestjs/common';
import { UserPreferenceService } from '../services/user-preference.service';

@Controller('preferences')
export class PreferenceController {
  constructor(private readonly preferenceService: UserPreferenceService) {}

  @Get(':userId')
  async getPreferences(@Param('userId') userId: string) {
    const preference = await this.preferenceService.getOrCreatePreference(userId);

    return {
      success: true,
      data: preference,
    };
  }

  @Put(':userId')
  async updatePreferences(
    @Param('userId') userId: string,
    @Body(ValidationPipe)
    body: {
      emailEnabled?: boolean;
      smsEnabled?: boolean;
      pushEnabled?: boolean;
      marketingEnabled?: boolean;
      orderUpdates?: boolean;
      paymentUpdates?: boolean;
      cartReminders?: boolean;
      productRecommendations?: boolean;
      email?: string;
      phoneNumber?: string;
      language?: string;
      timezone?: string;
    },
  ) {
    const preference = await this.preferenceService.updatePreference(userId, body);

    return {
      success: true,
      data: preference,
      message: 'Preferences updated successfully',
    };
  }

  @Put(':userId/push-tokens')
  async addPushToken(
    @Param('userId') userId: string,
    @Body(ValidationPipe) body: { token: string },
  ) {
    await this.preferenceService.addPushToken(userId, body.token);

    return {
      success: true,
      message: 'Push token added successfully',
    };
  }
}
