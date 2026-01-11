import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CartService } from '../../application/services/cart.service';

@Injectable()
export class CartCleanupTask {
  private readonly logger = new Logger(CartCleanupTask.name);

  constructor(private readonly cartService: CartService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCartCleanup() {
    this.logger.log('Running expired cart cleanup...');
    
    try {
      const deleted = await this.cartService.cleanupExpiredCarts();
      this.logger.log(`Deleted ${deleted} expired carts`);
    } catch (error) {
      this.logger.error('Failed to cleanup expired carts', error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleAbandonmentCheck() {
    this.logger.log('Checking for abandoned carts...');
    
    try {
      const marked = await this.cartService.markAbandonedCarts();
      this.logger.log(`Marked ${marked} carts as abandoned`);
    } catch (error) {
      this.logger.error('Failed to mark abandoned carts', error);
    }
  }
}
