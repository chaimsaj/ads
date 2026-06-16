import type { Transaction, PrismaClient, Prisma } from '@prisma/client';

import type { ITransactionRepository } from '../interfaces/transaction-repository.interface';
import type {
  CreateTransactionData,
  TransactionFilters,
  PaginationParams,
  PaginatedResult,
} from '../types/payment.types';

export class TransactionRepository implements ITransactionRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<Transaction | null> {
    return this.db.transaction.findUnique({
      where: { id },
    });
  }

  async findByStripePaymentIntentId(intentId: string): Promise<Transaction | null> {
    return this.db.transaction.findFirst({
      where: { stripePaymentIntentId: intentId },
    });
  }

  async findMany(
    filters: TransactionFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<Transaction>> {
    const where = this.buildWhereClause(filters);

    const [data, total] = await Promise.all([
      this.db.transaction.findMany({
        where,
        orderBy: { [pagination.sortBy ?? 'createdAt']: pagination.sortOrder ?? 'desc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      this.db.transaction.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async create(data: CreateTransactionData): Promise<Transaction> {
    return this.db.transaction.create({
      data: {
        userId: data.userId,
        campaignId: data.campaignId ?? null,
        paymentMethodId: data.paymentMethodId ?? null,
        type: data.type,
        amount: data.amount,
        currency: data.currency ?? 'USD',
        status: data.status ?? 'PENDING',
        stripePaymentIntentId: data.stripePaymentIntentId ?? null,
        stripeChargeId: data.stripeChargeId ?? null,
        description: data.description ?? null,
        failureReason: data.failureReason ?? null,
        metadata: data.metadata as Prisma.InputJsonValue ?? undefined,
      },
    });
  }

  async updateStatus(id: string, status: string, failureReason?: string): Promise<Transaction> {
    return this.db.transaction.update({
      where: { id },
      data: {
        status: status as Transaction['status'],
        ...(failureReason !== undefined && { failureReason }),
      },
    });
  }

  async getTotalRevenue(since?: Date): Promise<number> {
    const result = await this.db.transaction.aggregate({
      where: {
        type: 'CHARGE',
        status: 'COMPLETED',
        ...(since && { createdAt: { gte: since } }),
      },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }

  private buildWhereClause(filters: TransactionFilters): Prisma.TransactionWhereInput {
    const where: Prisma.TransactionWhereInput = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.campaignId) {
      where.campaignId = filters.campaignId;
    }

    if (filters.type) {
      where.type = filters.type as Transaction['type'];
    }

    if (filters.status) {
      where.status = filters.status as Transaction['status'];
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        (where.createdAt as Prisma.DateTimeFilter).gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        (where.createdAt as Prisma.DateTimeFilter).lte = filters.dateTo;
      }
    }

    return where;
  }
}
