import { UserPreferences } from '../models/user-preferences.model';

/**
 * Repository interface for UserPreferences domain model.
 * Defines contract for user preferences persistence operations.
 */
export interface IUserPreferencesRepository {
  /**
   * Find preferences by user ID.
   */
  findByUserId(userId: string): Promise<UserPreferences | null>;

  /**
   * Save preferences (create or update).
   */
  save(preferences: UserPreferences): Promise<UserPreferences>;

  /**
   * Delete preferences by user ID.
   */
  delete(userId: string): Promise<void>;

  /**
   * Create default preferences for user.
   */
  createDefault(userId: string): Promise<UserPreferences>;
}
