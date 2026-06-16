import type { PaymentMethod } from '@prisma/client';

import type { CreatePaymentMethodData } from '../types/payment.types';

export interface IPaymentMethodRepository {
  findById(id: string): Promise<PaymentMethod | null>;
  findByIdForUser(id: string, userId: string): Promise<PaymentMethod | null>;
  findAllForUser(userId: string): Promise<PaymentMethod[]>;
  findDefaultForUser(userId: string): Promise<PaymentMethod | null>;
  create(data: CreatePaymentMethodData): Promise<PaymentMethod>;
  delete(id: string): Promise<void>;
  setAsDefault(id: string, userId: string): Promise<PaymentMethod>;
  countForUser(userId: string): Promise<number>;
}
