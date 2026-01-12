import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IWishlistRepository } from '../../domain/interfaces/wishlist-repository.interface';
import { WishlistItem } from '../../domain/models/wishlist-item.model';
import { WishlistItemEntity } from '../persistence/entities/wishlist-item.entity';
import { WishlistItemMapper } from '../persistence/mappers/wishlist-item.mapper';

/**
 * TypeORM implementation of IWishlistRepository.
 * Handles wishlist persistence using TypeORM and mappers.
 */
@Injectable()
export class WishlistRepository implements IWishlistRepository {
  constructor(
    @InjectRepository(WishlistItemEntity)
    private readonly typeormRepository: Repository<WishlistItemEntity>,
  ) {}

  async findById(id: string): Promise<WishlistItem | null> {
    const entity = await this.typeormRepository.findOne({ where: { id } });
    return entity ? WishlistItemMapper.toDomain(entity) : null;
  }

  async findByUserId(userId: string): Promise<WishlistItem[]> {
    const entities = await this.typeormRepository.find({
      where: { userId },
      order: { addedAt: 'DESC' },
    });
    return WishlistItemMapper.toDomainList(entities);
  }

  async findByUserAndProduct(
    userId: string,
    productId: string,
  ): Promise<WishlistItem | null> {
    const entity = await this.typeormRepository.findOne({
      where: { userId, productId },
    });
    return entity ? WishlistItemMapper.toDomain(entity) : null;
  }

  async save(item: WishlistItem): Promise<WishlistItem> {
    const entity = WishlistItemMapper.toEntity(item);
    const saved = await this.typeormRepository.save(entity);
    return WishlistItemMapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.typeormRepository.delete(id);
  }

  async deleteByUserAndProduct(
    userId: string,
    productId: string,
  ): Promise<void> {
    await this.typeormRepository.delete({ userId, productId });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.typeormRepository.delete({ userId });
  }

  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    const count = await this.typeormRepository.count({
      where: { userId, productId },
    });
    return count > 0;
  }

  async countByUserId(userId: string): Promise<number> {
    return await this.typeormRepository.count({ where: { userId } });
  }
}
