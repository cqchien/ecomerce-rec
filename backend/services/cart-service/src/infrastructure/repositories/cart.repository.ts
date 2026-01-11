import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cart } from '../../domain/models/cart.model';
import { ICartRepository } from '../../domain/interfaces/cart-repository.interface';
import { CartEntity } from '../persistence/entities/cart.entity';
import { CartMapper } from '../persistence/mappers/cart.mapper';
import { CART_EXPIRY_DAYS } from '../../common/constants';

/**
 * Cart Repository Implementation (Infrastructure Layer)
 * Implements ICartRepository using TypeORM
 * Converts between TypeORM entities and domain models
 */
@Injectable()
export class CartRepository implements ICartRepository {
  constructor(
    @InjectRepository(CartEntity)
    private readonly typeormRepository: Repository<CartEntity>,
  ) {}

  async findByUserId(userId: string): Promise<Cart | null> {
    const entity = await this.typeormRepository.findOne({
      where: { userId },
      relations: ['items'],
    });
    return entity ? CartMapper.toDomain(entity) : null;
  }

  async findById(id: string): Promise<Cart | null> {
    const entity = await this.typeormRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    return entity ? CartMapper.toDomain(entity) : null;
  }

  async save(cart: Cart): Promise<Cart> {
    const entity = CartMapper.toEntity(cart);
    const saved = await this.typeormRepository.save(entity);
    return CartMapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.typeormRepository.delete(id);
  }

  async findAbandonedCarts(days: number): Promise<Cart[]> {
    const abandonedDate = new Date();
    abandonedDate.setDate(abandonedDate.getDate() - days);

    const entities = await this.typeormRepository.find({
      where: {
        updatedAt: LessThan(abandonedDate),
      },
      relations: ['items'],
    });

    return entities.map(entity => CartMapper.toDomain(entity));
  }

  async findExpiredCarts(): Promise<Cart[]> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - CART_EXPIRY_DAYS);

    const entities = await this.typeormRepository.find({
      where: {
        updatedAt: LessThan(expiryDate),
      },
    });

    return entities.map(entity => CartMapper.toDomain(entity));
  }

  async deleteMany(ids: string[]): Promise<void> {
    await this.typeormRepository.delete(ids);
  }
}
