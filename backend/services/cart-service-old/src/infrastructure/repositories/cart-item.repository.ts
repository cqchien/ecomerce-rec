import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from '../../domain/models/cart-item.model';
import { ICartItemRepository } from '../../domain/interfaces/cart-item-repository.interface';
import { CartItemEntity } from '../persistence/entities/cart-item.entity';
import { CartItemMapper } from '../persistence/mappers/cart-item.mapper';

/**
 * Cart Item Repository Implementation (Infrastructure Layer)
 * Implements ICartItemRepository using TypeORM
 * Converts between TypeORM entities and domain models
 */
@Injectable()
export class CartItemRepository implements ICartItemRepository {
  constructor(
    @InjectRepository(CartItemEntity)
    private readonly typeormRepository: Repository<CartItemEntity>,
  ) {}

  async findById(id: string): Promise<CartItem | null> {
    const entity = await this.typeormRepository.findOne({ where: { id } });
    return entity ? CartItemMapper.toDomain(entity) : null;
  }

  async findByCartId(cartId: string): Promise<CartItem[]> {
    const entities = await this.typeormRepository.find({ where: { cartId } });
    return entities.map(entity => CartItemMapper.toDomain(entity));
  }

  async save(cartItem: CartItem): Promise<CartItem> {
    const entity = CartItemMapper.toEntity(cartItem);
    const saved = await this.typeormRepository.save(entity);
    return CartItemMapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.typeormRepository.delete(id);
  }

  async deleteByCartId(cartId: string): Promise<void> {
    await this.typeormRepository.delete({ cartId });
  }
}
