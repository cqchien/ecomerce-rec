import { Injectable, Inject } from '@nestjs/common';
import { UserPreferences } from '../../domain/models/user-preferences.model';
import { IUserPreferencesRepository } from '../../domain/interfaces/user-preferences-repository.interface';
import { UpdatePreferencesDto } from '../dto/update-preferences.dto';
import { 
  CACHE_KEY_PREFERENCES, 
  PREFERENCES_CACHE_TTL,
} from '../../common/constants';
import { ICacheService } from '../../domain/interfaces/cache.interface';

@Injectable()
export class PreferencesService {
  constructor(
    @Inject('IUserPreferencesRepository')
    private readonly preferencesRepository: IUserPreferencesRepository,
    @Inject('ICacheService')
    private readonly cacheService: ICacheService,
  ) {}

  /**
   * Get user preferences.
   * Checks cache first, then retrieves from database or creates default preferences.
   * @param userId - The user ID
   * @returns User preferences
   */
  async getPreferences(userId: string): Promise<UserPreferences> {
    const cacheKey = `${CACHE_KEY_PREFERENCES}${userId}`;
    const cached = await this.cacheService.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached as string);
    }

    let preferences = await this.preferencesRepository.findByUserId(userId);

    if (!preferences) {
      preferences = await this.preferencesRepository.createDefault(userId);
    }

    await this.cacheService.set(cacheKey, JSON.stringify(preferences), PREFERENCES_CACHE_TTL);

    return preferences;
  }

  /**
   * Update user preferences.
   * Uses domain model methods for business logic and invalidates cache.
   * @param dto - The update preferences data transfer object
   * @returns Updated preferences
   */
  async updatePreferences(dto: UpdatePreferencesDto): Promise<UserPreferences> {
    let preferences = await this.preferencesRepository.findByUserId(dto.userId);

    if (!preferences) {
      preferences = await this.preferencesRepository.createDefault(dto.userId);
    }

    if (dto.emailNotifications !== undefined || 
        dto.smsNotifications !== undefined || 
        dto.marketingEmails !== undefined) {
      preferences.updateNotificationPreferences({
        emailNotifications: dto.emailNotifications,
        smsNotifications: dto.smsNotifications,
        marketingEmails: dto.marketingEmails,
      });
    }

    if (dto.language !== undefined) {
      preferences.updateLanguage(dto.language);
    }

    if (dto.currency !== undefined) {
      preferences.updateCurrency(dto.currency);
    }

    const updatedPreferences = await this.preferencesRepository.save(preferences);

    const cacheKey = `${CACHE_KEY_PREFERENCES}${dto.userId}`;
    await this.cacheService.del(cacheKey);

    return updatedPreferences;
  }
}
