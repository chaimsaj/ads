import type { Transaction } from '@prisma/client';

import type {
  CreateTransactionData,
  TransactionFilters,
  PaginationParams,
  PaginatedResult,
} from '../types/payment.types';

export interface ITransactionRepository {
  findById(id: string): Promise<Transaction | null>;
  findByStripePaymentIntentId(intentId: string): Promise<Transaction | null>;
  findMany(filters: TransactionFilters, pagination: PaginationParams): Promise<PaginatedResult<Transaction>>;
  create(data: CreateTransactionData): Promise<Transaction>;
  updateStatus(id: string, status: string, failureReason?: string): Promise<Transaction>;
  getTotalRevenue(since?: Date): Promise<number>;
}
