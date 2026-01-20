import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserPreferencesRepository } from '../../domain/interfaces/user-preferences-repository.interface';
import { UserPreferences } from '../../domain/models/user-preferences.model';
import { UserPreferencesEntity } from '../persistence/entities/user-preferences.entity';
import { UserPreferencesMapper } from '../persistence/mappers/user-preferences.mapper';

/**
 * TypeORM implementation of IUserPreferencesRepository.
 * Handles user preferences persistence using TypeORM and mappers.
 */
@Injectable()
export class UserPreferencesRepository implements IUserPreferencesRepository {
  constructor(
    @InjectRepository(UserPreferencesEntity)
    private readonly typeormRepository: Repository<UserPreferencesEntity>,
  ) {}

  async findByUserId(userId: string): Promise<UserPreferences | null> {
    const entity = await this.typeormRepository.findOne({
      where: { userId },
    });
    return entity ? UserPreferencesMapper.toDomain(entity) : null;
  }

  async save(preferences: UserPreferences): Promise<UserPreferences> {
    const entity = UserPreferencesMapper.toEntity(preferences);
    const saved = await this.typeormRepository.save(entity);
    return UserPreferencesMapper.toDomain(saved);
  }

  async delete(userId: string): Promise<void> {
    await this.typeormRepository.delete({ userId });
  }

  async createDefault(userId: string): Promise<UserPreferences> {
    const defaultPreferences = new UserPreferences({
      userId,
      emailNotifications: true,
      smsNotifications: false,
      marketingEmails: false,
      language: 'en',
      currency: 'USD',
      updatedAt: new Date(),
    });
    return await this.save(defaultPreferences);
  }
}
