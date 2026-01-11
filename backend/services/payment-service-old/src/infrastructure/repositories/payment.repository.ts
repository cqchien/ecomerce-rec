import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../domain/entities/payment.entity';
import { IPaymentRepository } from '../../domain/interfaces/payment.repository.interface';

@Injectable()
export class PaymentRepository implements IPaymentRepository {
  constructor(
    @InjectRepository(Payment)
    private readonly repository: Repository<Payment>,
  ) {}

  async create(paymentData: Partial<Payment>): Promise<Payment> {
    const payment = this.repository.create(paymentData);
    return this.repository.save(payment);
  }

  async findById(id: string): Promise<Payment | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['refunds'],
    });
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    return this.repository.findOne({
      where: { orderId },
      relations: ['refunds'],
    });
  }

  async findByUserId(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ payments: Payment[]; total: number }> {
    const [payments, total] = await this.repository.findAndCount({
      where: { userId },
      relations: ['refunds'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { payments, total };
  }

  async update(id: string, data: Partial<Payment>): Promise<Payment> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async save(payment: Payment): Promise<Payment> {
    return this.repository.save(payment);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
