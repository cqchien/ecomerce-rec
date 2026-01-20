import { UserPreferences } from '../../../domain/models/user-preferences.model';
import { UserPreferencesEntity } from '../entities/user-preferences.entity';

/**
 * Mapper for UserPreferences domain model and UserPreferencesEntity.
 * Handles conversion between domain and persistence layers.
 */
export class UserPreferencesMapper {
  /**
   * Convert UserPreferencesEntity to UserPreferences domain model.
   */
  static toDomain(entity: UserPreferencesEntity): UserPreferences {
    return new UserPreferences({
      userId: entity.userId,
      emailNotifications: entity.emailNotifications,
      smsNotifications: entity.smsNotifications,
      marketingEmails: entity.marketingEmails,
      language: entity.language,
      currency: entity.currency,
      updatedAt: entity.updatedAt,
    });
  }

  /**
   * Convert UserPreferences domain model to UserPreferencesEntity.
   */
  static toEntity(model: UserPreferences): UserPreferencesEntity {
    const entity = new UserPreferencesEntity();
    entity.userId = model.userId;
    entity.emailNotifications = model.emailNotifications;
    entity.smsNotifications = model.smsNotifications;
    entity.marketingEmails = model.marketingEmails;
    entity.language = model.language;
    entity.currency = model.currency;
    entity.updatedAt = model.updatedAt;
    return entity;
  }

  /**
   * Convert array of UserPreferencesEntity to array of UserPreferences domain models.
   */
  static toDomainList(entities: UserPreferencesEntity[]): UserPreferences[] {
    return entities.map(entity => this.toDomain(entity));
  }

  /**
   * Convert array of UserPreferences domain models to array of UserPreferencesEntity.
   */
  static toEntityList(models: UserPreferences[]): UserPreferencesEntity[] {
    return models.map(model => this.toEntity(model));
  }
}
