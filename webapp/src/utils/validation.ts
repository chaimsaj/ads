// Validation utility functions

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ValidationRule {
  validate: (value: string) => boolean;
  message: string;
}

// Common validation rules
export const required = (fieldName: string): ValidationRule => ({
  validate: (value: string) => value.trim().length > 0,
  message: `${fieldName} is required`,
});

export const minLength = (min: number, fieldName: string): ValidationRule => ({
  validate: (value: string) => value.length >= min,
  message: `${fieldName} must be at least ${min} characters`,
});

export const maxLength = (max: number, fieldName: string): ValidationRule => ({
  validate: (value: string) => value.length <= max,
  message: `${fieldName} must be no more than ${max} characters`,
});

export const email: ValidationRule = {
  validate: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  message: 'Please enter a valid email address',
};

export const url: ValidationRule = {
  validate: (value: string) => {
    if (!value) return true; // Allow empty for optional fields
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  message: 'Please enter a valid URL (e.g., https://example.com)',
};

export const phone: ValidationRule = {
  validate: (value: string) => {
    if (!value) return true;
    return /^[\d\s\-+()]+$/.test(value) && value.replace(/\D/g, '').length >= 10;
  },
  message: 'Please enter a valid phone number',
};

export const password: ValidationRule = {
  validate: (value: string) => value.length >= 8,
  message: 'Password must be at least 8 characters',
};

export const passwordStrength: ValidationRule = {
  validate: (value: string) => {
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    return value.length >= 8 && hasUpperCase && hasLowerCase && hasNumber;
  },
  message: 'Password must contain uppercase, lowercase, and number',
};

export const matchField = (matchValue: string, fieldName: string): ValidationRule => ({
  validate: (value: string) => value === matchValue,
  message: `${fieldName} do not match`,
});

export const numeric: ValidationRule = {
  validate: (value: string) => /^\d+$/.test(value),
  message: 'Please enter numbers only',
};

export const positiveNumber: ValidationRule = {
  validate: (value: string) => {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
  },
  message: 'Please enter a positive number',
};

export const creditCard: ValidationRule = {
  validate: (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    return /^\d{13,19}$/.test(cleaned);
  },
  message: 'Please enter a valid card number',
};

export const cvv: ValidationRule = {
  validate: (value: string) => /^\d{3,4}$/.test(value),
  message: 'CVV must be 3 or 4 digits',
};

export const expiryDate: ValidationRule = {
  validate: (value: string) => {
    if (!/^\d{2}\/\d{2}$/.test(value)) return false;
    const [month, year] = value.split('/').map(Number);
    if (month < 1 || month > 12) return false;
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    return year > currentYear || (year === currentYear && month >= currentMonth);
  },
  message: 'Please enter a valid expiry date (MM/YY)',
};

export const zipCode: ValidationRule = {
  validate: (value: string) => /^\d{5}(-\d{4})?$/.test(value),
  message: 'Please enter a valid ZIP code',
};

// Validate a value against multiple rules
export function validate(value: string, rules: ValidationRule[]): ValidationResult {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      return { isValid: false, error: rule.message };
    }
  }
  return { isValid: true };
}

// Validate an entire form
export type FormErrors<T> = Partial<Record<keyof T, string>>;

export function validateForm<T extends Record<string, string>>(
  values: T,
  validationSchema: Partial<Record<keyof T, ValidationRule[]>>
): { isValid: boolean; errors: FormErrors<T> } {
  const errors: FormErrors<T> = {};
  let isValid = true;

  for (const [field, rules] of Object.entries(validationSchema)) {
    if (rules) {
      const result = validate(values[field as keyof T] || '', rules as ValidationRule[]);
      if (!result.isValid) {
        isValid = false;
        errors[field as keyof T] = result.error;
      }
    }
  }

  return { isValid, errors };
}

// Format helpers for input masks
export function formatCreditCard(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  const groups = cleaned.match(/.{1,4}/g) || [];
  return groups.join(' ').substring(0, 19);
}

export function formatExpiryDate(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length >= 2) {
    return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
  }
  return cleaned;
}

export function formatPhone(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
}
