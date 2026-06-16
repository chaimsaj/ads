import type { PaymentMethod, PrismaClient } from '@prisma/client';

import type { IPaymentMethodRepository } from '../interfaces/payment-method-repository.interface';
import type { CreatePaymentMethodData } from '../types/payment.types';

export class PaymentMethodRepository implements IPaymentMethodRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<PaymentMethod | null> {
    return this.db.paymentMethod.findUnique({
      where: { id },
    });
  }

  async findByIdForUser(id: string, userId: string): Promise<PaymentMethod | null> {
    return this.db.paymentMethod.findFirst({
      where: { id, userId },
    });
  }

  async findAllForUser(userId: string): Promise<PaymentMethod[]> {
    return this.db.paymentMethod.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findDefaultForUser(userId: string): Promise<PaymentMethod | null> {
    return this.db.paymentMethod.findFirst({
      where: { userId, isDefault: true },
    });
  }

  async create(data: CreatePaymentMethodData): Promise<PaymentMethod> {
    return this.db.paymentMethod.create({
      data: {
        userId: data.userId,
        cardType: data.cardType,
        lastFour: data.lastFour,
        expiryMonth: data.expiryMonth,
        expiryYear: data.expiryYear,
        cardholderName: data.cardholderName,
        isDefault: data.isDefault ?? false,
        stripePaymentMethodId: data.stripePaymentMethodId ?? null,
        stripeCustomerId: data.stripeCustomerId ?? null,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.paymentMethod.delete({
      where: { id },
    });
  }

  async setAsDefault(id: string, userId: string): Promise<PaymentMethod> {
    await this.db.$transaction([
      this.db.paymentMethod.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      }),
      this.db.paymentMethod.update({
        where: { id },
        data: { isDefault: true },
      }),
    ]);

    return this.db.paymentMethod.findUniqueOrThrow({ where: { id } });
  }

  async countForUser(userId: string): Promise<number> {
    return this.db.paymentMethod.count({
      where: { userId },
    });
  }
}
