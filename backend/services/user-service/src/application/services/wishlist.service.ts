import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { IWishlistRepository } from '../../domain/interfaces/wishlist-repository.interface';
import { ICacheService } from '../../domain/interfaces/cache.interface';
import { WishlistItem } from '../../domain/models/wishlist-item.model';
import { CACHE_KEY_WISHLIST, WISHLIST_CACHE_TTL, DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../common/constants';

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedWishlist {
  items: WishlistItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable()
export class WishlistService {
  constructor(
    @Inject('IWishlistRepository')
    private readonly wishlistRepository: IWishlistRepository,
    @Inject('ICacheService')
    private readonly cacheService: ICacheService,
  ) {}

  /**
   * Get paginated wishlist for a user.
   */
  async getWishlist(userId: string, pagination?: PaginationParams): Promise<PaginatedWishlist> {
    const page = pagination?.page || DEFAULT_PAGE;
    const pageSize = Math.min(pagination?.pageSize || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const skip = (page - 1) * pageSize;

    if (page === DEFAULT_PAGE && pageSize === DEFAULT_PAGE_SIZE) {
      const cacheKey = `${CACHE_KEY_WISHLIST}${userId}`;
      const cached = await this.cacheService.get<PaginatedWishlist>(cacheKey);
      
      if (cached) {
        return cached;
      }
    }

    const allItems = await this.wishlistRepository.findByUserId(userId);
    const total = allItems.length;
    const items = allItems
      .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime())
      .slice(skip, skip + pageSize);

    const result = {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };

    if (page === DEFAULT_PAGE && pageSize === DEFAULT_PAGE_SIZE) {
      const cacheKey = `${CACHE_KEY_WISHLIST}${userId}`;
      await this.cacheService.set(cacheKey, result, WISHLIST_CACHE_TTL);
    }

    return result;
  }

  /**
   * Add product to user's wishlist.
   */
  async addToWishlist(userId: string, productId: string): Promise<WishlistItem> {
    const isInWishlist = await this.wishlistRepository.isInWishlist(userId, productId);

    if (isInWishlist) {
      throw new ConflictException('Product already in wishlist');
    }

    const item = new WishlistItem(
      uuidv4(),
      userId,
      productId,
      new Date(),
    );

    const validation = item.validate();
    if (!validation.valid) {
      throw new ConflictException(`Invalid wishlist item: ${validation.errors.join(', ')}`);
    }

    const savedItem = await this.wishlistRepository.save(item);
    await this.invalidateWishlistCache(userId);

    return savedItem;
  }

  /**
   * Remove product from user's wishlist.
   */
  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    const item = await this.wishlistRepository.findByUserAndProduct(userId, productId);

    if (!item) {
      throw new NotFoundException('Product not found in wishlist');
    }

    await this.wishlistRepository.deleteByUserAndProduct(userId, productId);
    await this.invalidateWishlistCache(userId);
  }

  /**
   * Invalidate cached wishlist for a user.
   */
  private async invalidateWishlistCache(userId: string): Promise<void> {
    const cacheKey = `${CACHE_KEY_WISHLIST}${userId}`;
    await this.cacheService.del(cacheKey);
  }
}
