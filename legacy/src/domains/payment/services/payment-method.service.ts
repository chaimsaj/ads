import { NotFoundError, ValidationError } from '../../../infrastructure/errors';
import type { IPaymentMethodRepository } from '../interfaces/payment-method-repository.interface';
import type { PaymentMethodDTO, CreatePaymentMethodData } from '../types/payment.types';

const MAX_PAYMENT_METHODS = 10;

export class PaymentMethodService {
  constructor(private readonly paymentMethodRepo: IPaymentMethodRepository) {}

  async getPaymentMethods(userId: string): Promise<PaymentMethodDTO[]> {
    const methods = await this.paymentMethodRepo.findAllForUser(userId);

    return methods.map((m) => ({
      id: m.id,
      cardType: m.cardType,
      lastFour: m.lastFour,
      expiryMonth: m.expiryMonth,
      expiryYear: m.expiryYear,
      cardholderName: m.cardholderName,
      isDefault: m.isDefault,
      stripePaymentMethodId: m.stripePaymentMethodId,
      createdAt: m.createdAt,
    }));
  }

  async addPaymentMethod(data: CreatePaymentMethodData): Promise<PaymentMethodDTO> {
    const count = await this.paymentMethodRepo.countForUser(data.userId);

    if (count >= MAX_PAYMENT_METHODS) {
      throw new ValidationError([
        { field: 'paymentMethod', message: `Maximum of ${MAX_PAYMENT_METHODS} payment methods allowed` },
      ]);
    }

    const isFirst = count === 0;
    const method = await this.paymentMethodRepo.create({
      ...data,
      isDefault: isFirst || data.isDefault,
    });

    return {
      id: method.id,
      cardType: method.cardType,
      lastFour: method.lastFour,
      expiryMonth: method.expiryMonth,
      expiryYear: method.expiryYear,
      cardholderName: method.cardholderName,
      isDefault: method.isDefault,
      stripePaymentMethodId: method.stripePaymentMethodId,
      createdAt: method.createdAt,
    };
  }

  async removePaymentMethod(id: string, userId: string): Promise<void> {
    const method = await this.paymentMethodRepo.findByIdForUser(id, userId);

    if (!method) {
      throw new NotFoundError('Payment method');
    }

    if (method.isDefault) {
      throw new ValidationError([
        { field: 'paymentMethod', message: 'Set another payment method as default first' },
      ]);
    }

    await this.paymentMethodRepo.delete(id);
  }

  async setAsDefault(id: string, userId: string): Promise<PaymentMethodDTO> {
    const method = await this.paymentMethodRepo.findByIdForUser(id, userId);

    if (!method) {
      throw new NotFoundError('Payment method');
    }

    const updated = await this.paymentMethodRepo.setAsDefault(id, userId);

    return {
      id: updated.id,
      cardType: updated.cardType,
      lastFour: updated.lastFour,
      expiryMonth: updated.expiryMonth,
      expiryYear: updated.expiryYear,
      cardholderName: updated.cardholderName,
      isDefault: updated.isDefault,
      stripePaymentMethodId: updated.stripePaymentMethodId,
      createdAt: updated.createdAt,
    };
  }
}
