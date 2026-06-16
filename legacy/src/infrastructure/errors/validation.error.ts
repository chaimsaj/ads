import { AppError } from './app-error';

export interface ValidationDetail {
  readonly field: string;
  readonly message: string;
}

export class ValidationError extends AppError {
  public readonly details: ReadonlyArray<ValidationDetail>;

  constructor(details: ReadonlyArray<ValidationDetail>) {
    super('Validation failed', 422, 'VALIDATION_ERROR');
    this.details = details;
  }
}
