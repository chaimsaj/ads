import type { Request, Response, NextFunction } from 'express';

import { success, created, noContent } from '../../../infrastructure/http/response.helper';
import type { PaymentMethodService } from '../services/payment-method.service';

export class PaymentController {
  constructor(private readonly paymentService: PaymentMethodService) {}

  listMethods = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.paymentService.getPaymentMethods(req.user!.sub);
      success(res, result);
    } catch (err) {
      next(err);
    }
  };

  addMethod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.paymentService.addPaymentMethod({
        userId: req.user!.sub,
        cardType: req.body.cardType,
        lastFour: req.body.lastFour,
        expiryMonth: req.body.expiryMonth,
        expiryYear: req.body.expiryYear,
        cardholderName: req.body.cardholderName,
        isDefault: req.body.setAsDefault,
        stripePaymentMethodId: req.body.stripePaymentMethodId,
      });
      created(res, result, 'Payment method added');
    } catch (err) {
      next(err);
    }
  };

  removeMethod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      await this.paymentService.removePaymentMethod(id, req.user!.sub);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  setDefault = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.paymentService.setAsDefault(id, req.user!.sub);
      success(res, result, 'Default payment method updated');
    } catch (err) {
      next(err);
    }
  };
}
