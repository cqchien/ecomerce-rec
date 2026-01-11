import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Cart } from '../../domain/models/cart.model';
import { CartItem } from '../../domain/models/cart-item.model';
import { AddToCartDto, UpdateCartItemDto, RemoveFromCartDto, ApplyCouponDto } from '../../presentation/dto/cart.dto';
import { 
  CACHE_KEY_CART, 
  CACHE_KEY_USER_CART, 
  CART_CACHE_TTL,
  MAX_CART_ITEMS,
  KAFKA_TOPICS,
} from '../../common/constants';
import { ICacheService } from '../../domain/interfaces/cache.interface';
import { IEventPublisher } from '../../domain/interfaces/event-publisher.interface';
import { ICartRepository } from '../../domain/interfaces/cart-repository.interface';
import { ICartItemRepository } from '../../domain/interfaces/cart-item-repository.interface';

/**
 * Cart Service - Application Layer
 * Uses dependency injection with domain interfaces for clean architecture
 */
@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @Inject('ICartItemRepository')
    private readonly cartItemRepository: ICartItemRepository,
    @Inject('ICacheService')
    private readonly cacheService: ICacheService,
    @Inject('IEventPublisher')
    private readonly eventPublisher: IEventPublisher,
    @Inject('ICartRepository')
    private readonly cartRepository: ICartRepository,
  ) {}

  /**
   * Get cart for user with caching
   */
  async getCart(userId: string): Promise<Cart> {
    const cacheKey = `${CACHE_KEY_USER_CART}${userId}`;
    const cached = await this.cacheService.get<Cart>(cacheKey);
    
    if (cached) {
      return cached;
    }

    let cart = await this.cartRepository.findByUserId(userId);

    if (!cart) {
      cart = await this.createCart(userId);
    }

    cart.calculateTotals();
    await this.cartRepository.save(cart);
    await this.cacheService.set(cacheKey, cart, CART_CACHE_TTL);

    return cart;
  }

  /**
   * Add item to cart
   */
  async addToCart(dto: AddToCartDto): Promise<Cart> {
    let cart = await this.cartRepository.findByUserId(dto.userId);

    if (!cart) {
      cart = await this.createCart(dto.userId);
    }

    if (cart.items.length >= MAX_CART_ITEMS) {
      throw new BadRequestException(`Cart cannot have more than ${MAX_CART_ITEMS} items`);
    }

    const existingItem = cart.findItem(dto.productId, dto.variantId);
    let cartItemId: string;
    let quantityChanged: number;

    if (existingItem) {
      quantityChanged = dto.quantity;
      existingItem.addQuantity(dto.quantity);
      await this.cartItemRepository.save(existingItem);
      cartItemId = existingItem.id;
    } else {
      const cartItem = new CartItem(
        uuidv4(),
        cart.id,
        dto.productId,
        dto.name,
        dto.unitPrice,
        dto.quantity,
        dto.quantity * dto.unitPrice,
        dto.variantId,
        dto.image,
        dto.sku,
      );
      cartItem.calculateTotalPrice();

      await this.cartItemRepository.save(cartItem);
      cart.items.push(cartItem);
      cartItemId = cartItem.id;
      quantityChanged = dto.quantity;
    }

    cart.calculateTotals();
    await this.cartRepository.save(cart);
    await this.invalidateCartCache(dto.userId, cart.id);

    await this.eventPublisher.publish(KAFKA_TOPICS.CART_ITEM_ADDED, {
      cartId: cart.id,
      userId: dto.userId,
      cartItemId,
      productId: dto.productId,
      variantId: dto.variantId,
      name: dto.name,
      quantity: quantityChanged,
      unitPrice: dto.unitPrice,
      totalPrice: quantityChanged * dto.unitPrice,
      cartSubtotal: cart.subtotal,
      cartTotal: cart.total,
      timestamp: new Date(),
    });
    this.logger.log(`Cart item added event published for user: ${dto.userId}`);

    return cart;
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(dto: UpdateCartItemDto): Promise<Cart> {
    const cart = await this.cartRepository.findByUserId(dto.userId);

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const item = cart.items.find(i => i.id === dto.cartItemId);
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    const oldQuantity = item.quantity;
    item.updateQuantity(dto.quantity);
    await this.cartItemRepository.save(item);

    cart.calculateTotals();
    await this.cartRepository.save(cart);
    await this.invalidateCartCache(dto.userId, cart.id);

    await this.eventPublisher.publish(KAFKA_TOPICS.CART_ITEM_UPDATED, {
      cartId: cart.id,
      userId: dto.userId,
      cartItemId: dto.cartItemId,
      productId: item.productId,
      variantId: item.variantId,
      oldQuantity,
      newQuantity: dto.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      cartSubtotal: cart.subtotal,
      cartTotal: cart.total,
      timestamp: new Date(),
    });
    this.logger.log(`Cart item updated event published for user: ${dto.userId}`);

    return cart;
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(dto: RemoveFromCartDto): Promise<Cart> {
    const cart = await this.cartRepository.findByUserId(dto.userId);

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const removedItem = cart.removeItem(dto.cartItemId);
    if (!removedItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.cartItemRepository.delete(dto.cartItemId);
    await this.cartRepository.save(cart);
    await this.invalidateCartCache(dto.userId, cart.id);

    await this.eventPublisher.publish(KAFKA_TOPICS.CART_ITEM_REMOVED, {
      cartId: cart.id,
      userId: dto.userId,
      cartItemId: dto.cartItemId,
      productId: removedItem.productId,
      variantId: removedItem.variantId,
      quantity: removedItem.quantity,
      unitPrice: removedItem.unitPrice,
      totalPrice: removedItem.totalPrice,
      cartSubtotal: cart.subtotal,
      cartTotal: cart.total,
      timestamp: new Date(),
    });
    this.logger.log(`Cart item removed event published for user: ${dto.userId}`);

    return cart;
  }

  /**
   * Clear all items from cart
   */
  async clearCart(userId: string): Promise<void> {
    const cart = await this.cartRepository.findByUserId(userId);

    if (cart) {
      const clearedItems = [...cart.items];

      await this.cartItemRepository.deleteByCartId(cart.id);
      cart.reset();
      await this.cartRepository.save(cart);
      await this.invalidateCartCache(userId, cart.id);

      await this.eventPublisher.publish(KAFKA_TOPICS.CART_CLEARED, {
        cartId: cart.id,
        userId,
        itemsCount: clearedItems.length,
        timestamp: new Date(),
      });
      this.logger.log(`Cart cleared event published for user: ${userId}`);
    }
  }

  /**
   * Apply coupon to cart
   */
  async applyCoupon(dto: ApplyCouponDto): Promise<Cart> {
    const cart = await this.cartRepository.findByUserId(dto.userId);

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    cart.couponCode = dto.couponCode;
    const discountAmount = cart.subtotal * 0.1;
    cart.applyDiscount(discountAmount);

    await this.cartRepository.save(cart);
    await this.invalidateCartCache(dto.userId, cart.id);

    return cart;
  }

  /**
   * Remove coupon from cart
   */
  async removeCoupon(userId: string): Promise<Cart> {
    const cart = await this.cartRepository.findByUserId(userId);

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    cart.removeCoupon();
    await this.cartRepository.save(cart);
    await this.invalidateCartCache(userId, cart.id);

    return cart;
  }

  /**
   * Initiate checkout process
   */
  async initiateCheckout(userId: string): Promise<Cart> {
    const cart = await this.cartRepository.findByUserId(userId);

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    if (cart.isEmpty()) {
      throw new BadRequestException('Cannot checkout with empty cart');
    }

    await this.eventPublisher.publish(KAFKA_TOPICS.CART_CHECKOUT_STARTED, {
      cartId: cart.id,
      userId,
      items: cart.items.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
      subtotal: cart.subtotal,
      discount: cart.discount,
      total: cart.total,
      couponCode: cart.couponCode,
      timestamp: new Date(),
    });
    this.logger.log(`Checkout started event published for user: ${userId}`);

    return cart;
  }

  /**
   * Clean up expired carts
   */
  async cleanupExpiredCarts(): Promise<number> {
    const expiredCarts = await this.cartRepository.findExpiredCarts();
    
    if (expiredCarts.length === 0) {
      return 0;
    }

    const cartIds = expiredCarts.map(cart => cart.id);
    await this.cartRepository.deleteMany(cartIds);

    this.logger.log(`Cleaned up ${expiredCarts.length} expired carts`);
    return expiredCarts.length;
  }

  /**
   * Mark carts as abandoned
   */
  async markAbandonedCarts(): Promise<number> {
    const abandonedCarts = await this.cartRepository.findAbandonedCarts(1);
    
    let count = 0;
    for (const cart of abandonedCarts) {
      if (!cart.isAbandoned && cart.hasItems()) {
        cart.markAsAbandoned();
        await this.cartRepository.save(cart);

        await this.eventPublisher.publish(KAFKA_TOPICS.CART_ABANDONED, {
          cartId: cart.id,
          userId: cart.userId,
          items: cart.items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          subtotal: cart.subtotal,
          total: cart.total,
          abandonedAt: new Date(),
        });
        this.logger.log(`Abandoned cart event published for user: ${cart.userId}`);
        count++;
      }
    }

    return count;
  }

  private async createCart(userId: string): Promise<Cart> {
    const cart = new Cart(
      uuidv4(),
      userId,
      0,
      0,
      0,
      [],
      false,
      null,
      new Date(),
      new Date(),
    );

    return this.cartRepository.save(cart);
  }

  private async invalidateCartCache(userId: string, cartId: string): Promise<void> {
    const keys = [
      `${CACHE_KEY_USER_CART}${userId}`,
      `${CACHE_KEY_CART}${cartId}`,
    ];
    await Promise.all(keys.map(key => this.cacheService.del(key)));
  }
}
