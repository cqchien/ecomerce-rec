import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { User } from '../../domain/models/user.model';
import { UserEntity } from '../persistence/entities/user.entity';
import { UserMapper } from '../persistence/mappers/user.mapper';

/**
 * TypeORM implementation of IUserRepository.
 * Handles user persistence using TypeORM and mappers.
 */
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly typeormRepository: Repository<UserEntity>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const entity = await this.typeormRepository.findOne({
      where: { id },
      relations: ['addresses', 'wishlist'],
    });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.typeormRepository.findOne({
      where: { email },
      relations: ['addresses', 'wishlist'],
    });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<User[]> {
    const entities = await this.typeormRepository.find({
      relations: ['addresses', 'wishlist'],
    });
    return UserMapper.toDomainList(entities);
  }

  async findWithPagination(
    page: number,
    limit: number,
  ): Promise<{ users: User[]; total: number }> {
    const [entities, total] = await this.typeormRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['addresses', 'wishlist'],
    });

    return {
      users: UserMapper.toDomainList(entities),
      total,
    };
  }

  /**
   * Save user entity
   * Reloads with relations after save to ensure proper domain mapping
   */
  async save(user: User): Promise<User> {
    const entity = UserMapper.toEntity(user);
    const saved = await this.typeormRepository.save(entity);
    
    // Reload with relations to properly map back to domain
    const reloaded = await this.typeormRepository.findOne({
      where: { id: saved.id },
      relations: ['addresses', 'wishlist'],
    });
    
    return UserMapper.toDomain(reloaded!);
  }

  async delete(id: string): Promise<void> {
    await this.typeormRepository.delete(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.typeormRepository.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.typeormRepository.restore(id);
  }

  async emailExists(email: string): Promise<boolean> {
    const count = await this.typeormRepository.count({ where: { email } });
    return count > 0;
  }
}
