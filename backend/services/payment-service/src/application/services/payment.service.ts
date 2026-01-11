import { Injectable, NotFoundException, BadRequestException, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Payment } from '../../domain/models/payment.model';
import { Refund } from '../../domain/models/refund.model';
import { CreatePaymentDto } from '../../presentation/dto/create-payment.dto';
import { CreateRefundDto } from '../../presentation/dto/create-refund.dto';
import { ConfirmPaymentDto } from '../../presentation/dto/confirm-payment.dto';
import { IPaymentRepository } from '../../domain/interfaces/payment.repository.interface';
import { IRefundRepository } from '../../domain/interfaces/refund.repository.interface';
import { ICacheService } from '../../domain/interfaces/cache.interface';
import { IEventPublisher } from '../../domain/interfaces/event.interface';
import {
  PaymentStatus,
  PaymentProvider,
  RefundStatus,
  KAFKA_TOPICS,
  CACHE_KEYS,
  CACHE_TTL,
  ERROR_MESSAGES,
  PAYMENT_RULES,
  DECIMAL_PRECISION,
} from '../../common/constants';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly stripe: Stripe;

  constructor(
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
    @Inject('IRefundRepository')
    private readonly refundRepository: IRefundRepository,
    @Inject('ICacheService')
    private readonly cacheService: ICacheService,
    @Inject('IEventPublisher')
    private readonly eventPublisher: IEventPublisher,
    private readonly configService: ConfigService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
      });
      this.logger.log('Stripe initialized successfully');
    } else {
      this.logger.warn('Stripe secret key not found, payment processing will not work');
    }
  }

  /**
   * Create payment intent
   */
  async createPayment(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    this.logger.log(`Creating payment for order: ${createPaymentDto.orderId}`);

    if (createPaymentDto.amount < PAYMENT_RULES.MIN_AMOUNT || createPaymentDto.amount > PAYMENT_RULES.MAX_AMOUNT) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_PAYMENT_AMOUNT);
    }

    const existingPayment = await this.paymentRepository.findByOrderId(createPaymentDto.orderId);

    if (existingPayment) {
      if (existingPayment.isSucceeded()) {
        throw new BadRequestException(ERROR_MESSAGES.PAYMENT_ALREADY_PROCESSED);
      }
      return existingPayment;
    }

    const paymentIntent = await this.createStripePaymentIntent(createPaymentDto);

    const payment = this.paymentRepository.create({
      orderId: createPaymentDto.orderId,
      userId: createPaymentDto.userId,
      amount: this.roundAmount(createPaymentDto.amount),
      currency: createPaymentDto.currency,
      paymentMethod: createPaymentDto.paymentMethod,
      provider: PaymentProvider.STRIPE,
      paymentIntentId: paymentIntent.id,
      status: PaymentStatus.PENDING,
      receiptEmail: createPaymentDto.receiptEmail,
      description: createPaymentDto.description,
      metadata: createPaymentDto.metadata || {},
    });

    const savedPayment = await this.paymentRepository.save(payment);

    await this.invalidatePaymentCache(savedPayment.userId, savedPayment.orderId);

    await this.eventPublisher.publish(KAFKA_TOPICS.PAYMENT_INITIATED, {
      paymentId: savedPayment.id,
      orderId: savedPayment.orderId,
      userId: savedPayment.userId,
      amount: savedPayment.amount,
      currency: savedPayment.currency,
      status: savedPayment.status,
      createdAt: savedPayment.createdAt,
    });

    this.logger.log(`Payment created successfully: ${savedPayment.id}`);
    return savedPayment;
  }

    // Publish event to Kafka
    await this.eventPublisher.publish(KAFKA_TOPICS.PAYMENT_INITIATED, {
      paymentId: savedPayment.id,
      orderId: savedPayment.orderId,
      userId: savedPayment.userId,
      amount: savedPayment.amount,
      currency: savedPayment.currency,
      status: savedPayment.status,
      createdAt: savedPayment.createdAt,
    });

    this.logger.log(`Payment created successfully: ${savedPayment.id}`);
    return savedPayment;
  }

  /**
   * Confirm payment
   */
  async confirmPayment(paymentId: string, confirmDto: ConfirmPaymentDto): Promise<Payment> {
    const payment = await this.getPaymentById(paymentId);

    if (payment.isSucceeded()) {
      throw new BadRequestException(ERROR_MESSAGES.PAYMENT_ALREADY_PROCESSED);
    }

    if (payment.isCancelled()) {
      throw new BadRequestException(ERROR_MESSAGES.PAYMENT_CANCELLED);
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(payment.paymentIntentId, {
        payment_method: confirmDto.paymentMethodId,
      });

      await this.updatePaymentFromIntent(payment, paymentIntent);

      await this.invalidatePaymentCache(payment.userId, payment.orderId, paymentId);

      this.logger.log(`Payment confirmed: ${payment.id}`);
      return payment;
    } catch (error) {
      this.logger.error(`Payment confirmation failed: ${error.message}`);
      await this.handlePaymentFailure(payment, error);
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string): Promise<Payment> {
    // Try cache first
    const cacheKey = `${CACHE_KEYS.PAYMENT_BY_ID}${paymentId}`;
    const cached = await this.cacheService.get<Payment>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const payment = await this.paymentRepository.findById(paymentId);

    if (!payment) {
      throw new NotFoundException(ERROR_MESSAGES.PAYMENT_NOT_FOUND);
    }

    // Cache payment
    await this.cacheService.set(cacheKey, payment, CACHE_TTL.PAYMENT);

    return payment;
  }

  /**
   * Get payment by order ID
   */
  async getPaymentByOrderId(orderId: string): Promise<Payment> {
    // Try cache first
    const cacheKey = `${CACHE_KEYS.PAYMENT_BY_ORDER}${orderId}`;
    const cached = await this.cacheService.get<Payment>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const payment = await this.paymentRepository.findByOrderId(orderId);

    if (!payment) {
      throw new NotFoundException(ERROR_MESSAGES.PAYMENT_NOT_FOUND);
    }

    // Cache payment
    await this.cacheService.set(cacheKey, payment, CACHE_TTL.PAYMENT);

    return payment;
  }

  /**
   * List user payments
   */
  async listUserPayments(userId: string, page: number = 1, limit: number = 20): Promise<{ payments: Payment[]; total: number }> {
    const offset = (page - 1) * limit;
    return this.paymentRepository.findByUserId(userId, limit, offset);
  }

  /**
   * Create refund
   */
  async createRefund(paymentId: string, createRefundDto: CreateRefundDto): Promise<Refund> {
    const payment = await this.getPaymentById(paymentId);

    if (!payment.isSucceeded()) {
      throw new BadRequestException('Cannot refund payment that has not succeeded');
    }

    const maxRefundAmount = payment.calculateRefundableAmount();
    if (createRefundDto.amount > maxRefundAmount) {
      throw new BadRequestException(ERROR_MESSAGES.REFUND_AMOUNT_EXCEEDS);
    }

    if (!payment.canBeRefunded()) {
      this.logger.warn(`Refund window expired for payment ${paymentId}, but allowing admin override`);
    }

    try {
      const stripeRefund = await this.stripe.refunds.create({
        payment_intent: payment.paymentIntentId,
        amount: Math.round(createRefundDto.amount * 100),
        reason: this.mapRefundReason(createRefundDto.reason),
      });

      const refund = this.refundRepository.create({
        paymentId: payment.id,
        amount: this.roundAmount(createRefundDto.amount),
        reason: createRefundDto.reason,
        status: RefundStatus.PROCESSING,
        providerRefundId: stripeRefund.id,
        notes: createRefundDto.notes,
        requestedBy: createRefundDto.requestedBy,
        metadata: {},
      });

      const savedRefund = await this.refundRepository.save(refund);

      payment.refund(this.roundAmount(createRefundDto.amount));
      await this.paymentRepository.save(payment);

      await this.invalidatePaymentCache(payment.userId, payment.orderId, paymentId);

      await this.eventPublisher.publish(KAFKA_TOPICS.REFUND_INITIATED, {
        refundId: savedRefund.id,
        paymentId: payment.id,
        orderId: payment.orderId,
        userId: payment.userId,
        amount: savedRefund.amount,
        reason: savedRefund.reason,
        status: savedRefund.status,
        createdAt: savedRefund.createdAt,
      });

      this.logger.log(`Refund created successfully: ${savedRefund.id}`);
      return savedRefund;
    } catch (error) {
      this.logger.error(`Refund creation failed: ${error.message}`);
      throw new BadRequestException(`Refund failed: ${error.message}`);
    }
  }

  /**
   * Cancel payment
   */
  async cancelPayment(paymentId: string): Promise<Payment> {
    const payment = await this.getPaymentById(paymentId);

    if (payment.isSucceeded()) {
      throw new BadRequestException('Cannot cancel succeeded payment, use refund instead');
    }

    if (payment.isCancelled()) {
      return payment;
    }

    try {
      await this.stripe.paymentIntents.cancel(payment.paymentIntentId);

      payment.cancel();
      const cancelledPayment = await this.paymentRepository.save(payment);

      await this.invalidatePaymentCache(payment.userId, payment.orderId, paymentId);

      await this.eventPublisher.publish(KAFKA_TOPICS.PAYMENT_CANCELLED, {
        paymentId: cancelledPayment.id,
        orderId: cancelledPayment.orderId,
        userId: cancelledPayment.userId,
        amount: cancelledPayment.amount,
        status: cancelledPayment.status,
        cancelledAt: cancelledPayment.cancelledAt,
      });

      this.logger.log(`Payment cancelled: ${paymentId}`);
      return cancelledPayment;
    } catch (error) {
      this.logger.error(`Payment cancellation failed: ${error.message}`);
      throw new BadRequestException(`Cancellation failed: ${error.message}`);
    }
  }

  /**
   * Handle Stripe webhook
   */
  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    this.logger.log(`Processing Stripe webhook: ${event.type}`);

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object as Stripe.Charge);
          break;
        default:
          this.logger.log(`Unhandled webhook event: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Webhook processing failed: ${error.message}`);
      throw error;
    }
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  private async createStripePaymentIntent(dto: CreatePaymentDto): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(dto.amount * 100), // Convert to cents
        currency: dto.currency.toLowerCase(),
        payment_method_types: ['card'],
        receipt_email: dto.receiptEmail,
        description: dto.description || `Payment for order ${dto.orderId}`,
        metadata: {
          orderId: dto.orderId,
          userId: dto.userId,
          ...dto.metadata,
        },
      });

      return paymentIntent;
    } catch (error) {
      this.logger.error(`Stripe payment intent creation failed: ${error.message}`);
      throw new BadRequestException(ERROR_MESSAGES.PAYMENT_PROVIDER_ERROR);
    }
  }

  private async updatePaymentFromIntent(payment: Payment, paymentIntent: Stripe.PaymentIntent): Promise<void> {
    if (paymentIntent.status === 'succeeded') {
      const cardDetails = paymentIntent.charges.data.length > 0 && paymentIntent.charges.data[0].payment_method_details?.card
        ? {
            last4: paymentIntent.charges.data[0].payment_method_details.card.last4,
            brand: paymentIntent.charges.data[0].payment_method_details.card.brand,
            expMonth: paymentIntent.charges.data[0].payment_method_details.card.exp_month,
            expYear: paymentIntent.charges.data[0].payment_method_details.card.exp_year,
          }
        : undefined;

      const receiptUrl = paymentIntent.charges.data.length > 0 ? paymentIntent.charges.data[0].receipt_url : undefined;

      payment.succeed(new Date(paymentIntent.created * 1000), paymentIntent.id, cardDetails, receiptUrl);

      await this.eventPublisher.publish(KAFKA_TOPICS.PAYMENT_SUCCEEDED, {
        paymentId: payment.id,
        orderId: payment.orderId,
        userId: payment.userId,
        amount: payment.amount,
        currency: payment.currency,
        transactionId: paymentIntent.id,
        paymentMethod: payment.paymentMethod,
        paidAt: payment.paidAt,
      });
    } else if (paymentIntent.status === 'processing') {
      payment.process();
      await this.eventPublisher.publish(KAFKA_TOPICS.PAYMENT_PROCESSING, {
        paymentId: payment.id,
        orderId: payment.orderId,
        userId: payment.userId,
        status: payment.status,
      });
    } else if (paymentIntent.status === 'requires_action') {
      payment.requiresAction();
    }

    await this.paymentRepository.save(payment);
  }

  private async handlePaymentFailure(payment: Payment, error: any): Promise<void> {
    payment.fail(error.code || 'unknown', error.message);
    await this.paymentRepository.save(payment);

    await this.eventPublisher.publish(KAFKA_TOPICS.PAYMENT_FAILED, {
      paymentId: payment.id,
      orderId: payment.orderId,
      userId: payment.userId,
      amount: payment.amount,
      errorCode: payment.failureCode,
      errorMessage: payment.failureMessage,
      failedAt: payment.failedAt,
    });
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { paymentIntentId: paymentIntent.id },
    });

    if (payment) {
      await this.updatePaymentFromIntent(payment, paymentIntent);
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { paymentIntentId: paymentIntent.id },
    });

    if (payment) {
      payment.status = PaymentStatus.FAILED;
      payment.failedAt = new Date();
      payment.failureMessage = paymentIntent.last_payment_error?.message;
      await this.paymentRepository.save(payment);

      await this.eventPublisher.publish(KAFKA_TOPICS.PAYMENT_FAILED, {
        paymentId: payment.id,
        orderId: payment.orderId,
        userId: payment.userId,
        amount: payment.amount,
        errorMessage: payment.failureMessage,
        failedAt: payment.failedAt,
      });
    }
  }

  private async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { providerPaymentId: charge.payment_intent as string },
    });

    if (payment) {
      // Update refund status if it exists
      const refund = await this.refundRepository.findOne({
        where: { paymentId: payment.id, status: RefundStatus.PROCESSING },
      });

      if (refund) {
        refund.status = RefundStatus.SUCCEEDED;
        refund.refundedAt = new Date();
        await this.refundRepository.save(refund);

        await this.eventPublisher.publish(KAFKA_TOPICS.REFUND_SUCCEEDED, {
          refundId: refund.id,
          paymentId: payment.id,
          orderId: payment.orderId,
          userId: payment.userId,
          amount: refund.amount,
          status: refund.status,
          refundedAt: refund.refundedAt,
        });
      }
    }
  }

  private roundAmount(amount: number): number {
    return Math.round(amount * Math.pow(10, DECIMAL_PRECISION.AMOUNT)) / Math.pow(10, DECIMAL_PRECISION.AMOUNT);
  }

  private mapRefundReason(reason: string): Stripe.RefundCreateParams.Reason {
    const mapping: Record<string, Stripe.RefundCreateParams.Reason> = {
      CUSTOMER_REQUEST: 'requested_by_customer',
      FRAUDULENT: 'fraudulent',
      DUPLICATE: 'duplicate',
    };
    return mapping[reason] || 'requested_by_customer';
  }

  private async invalidatePaymentCache(userId: string, orderId?: string, paymentId?: string): Promise<void> {
    const keys: string[] = [`${CACHE_KEYS.PAYMENTS_BY_USER}${userId}`];

    if (paymentId) {
      keys.push(`${CACHE_KEYS.PAYMENT_BY_ID}${paymentId}`);
    }

    if (orderId) {
      keys.push(`${CACHE_KEYS.PAYMENT_BY_ORDER}${orderId}`);
    }

    if (keys.length > 0) {
      await this.cacheService.del(...keys);
    }
  }
}
