export interface AdFormatDTO {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly dimensions: string | null;
  readonly basePrice: number;
  readonly minBudget: number;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface BoostTypeDTO {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly multiplier: number;
  readonly features: unknown;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
