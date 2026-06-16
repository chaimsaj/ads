import { describe, it, expect } from 'vitest';
import {
  required,
  minLength,
  maxLength,
  email,
  phone,
  password,
  passwordStrength,
  matchField,
  numeric,
  positiveNumber,
  creditCard,
  cvv,
  expiryDate,
  zipCode,
  url,
  validate,
  validateForm,
  formatCreditCard,
  formatExpiryDate,
  formatPhone,
} from '../validation';

describe('Validation Rules', () => {
  describe('required', () => {
    const rule = required('Field');

    it('returns true for non-empty string', () => {
      expect(rule.validate('hello')).toBe(true);
    });

    it('returns true for string with only spaces trimmed', () => {
      expect(rule.validate('hello world')).toBe(true);
    });

    it('returns false for empty string', () => {
      expect(rule.validate('')).toBe(false);
    });

    it('returns false for whitespace only', () => {
      expect(rule.validate('   ')).toBe(false);
    });

    it('returns false for tab characters only', () => {
      expect(rule.validate('\t\t')).toBe(false);
    });

    it('returns false for newline only', () => {
      expect(rule.validate('\n')).toBe(false);
    });

    it('has correct error message', () => {
      expect(rule.message).toBe('Field is required');
    });

    it('uses custom field name in message', () => {
      const customRule = required('Email Address');
      expect(customRule.message).toBe('Email Address is required');
    });
  });

  describe('minLength', () => {
    const rule = minLength(5, 'Password');

    it('returns true when length meets minimum', () => {
      expect(rule.validate('hello')).toBe(true);
    });

    it('returns true when length exceeds minimum', () => {
      expect(rule.validate('hello world')).toBe(true);
    });

    it('returns false when length below minimum', () => {
      expect(rule.validate('hi')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(rule.validate('')).toBe(false);
    });

    it('has correct error message', () => {
      expect(rule.message).toBe('Password must be at least 5 characters');
    });

    it('works with minimum of 1', () => {
      const oneCharRule = minLength(1, 'Name');
      expect(oneCharRule.validate('a')).toBe(true);
      expect(oneCharRule.validate('')).toBe(false);
    });
  });

  describe('maxLength', () => {
    const rule = maxLength(10, 'Username');

    it('returns true when length within limit', () => {
      expect(rule.validate('hello')).toBe(true);
    });

    it('returns true when length equals limit', () => {
      expect(rule.validate('helloworld')).toBe(true);
    });

    it('returns false when length exceeds limit', () => {
      expect(rule.validate('hello world!')).toBe(false);
    });

    it('returns true for empty string', () => {
      expect(rule.validate('')).toBe(true);
    });

    it('has correct error message', () => {
      expect(rule.message).toBe('Username must be no more than 10 characters');
    });
  });

  describe('email', () => {
    it('validates standard email format', () => {
      expect(email.validate('test@example.com')).toBe(true);
    });

    it('validates email with subdomain', () => {
      expect(email.validate('user@mail.example.com')).toBe(true);
    });

    it('validates email with plus sign', () => {
      expect(email.validate('user+tag@example.org')).toBe(true);
    });

    it('validates email with dots in local part', () => {
      expect(email.validate('user.name@domain.co.uk')).toBe(true);
    });

    it('validates email with numbers', () => {
      expect(email.validate('user123@example456.com')).toBe(true);
    });

    it('rejects email without @', () => {
      expect(email.validate('notanemail')).toBe(false);
    });

    it('rejects email without domain', () => {
      expect(email.validate('user@')).toBe(false);
    });

    it('rejects email without TLD', () => {
      expect(email.validate('user@domain')).toBe(false);
    });

    it('rejects email without local part', () => {
      expect(email.validate('@domain.com')).toBe(false);
    });

    it('rejects email with spaces', () => {
      expect(email.validate('user name@domain.com')).toBe(false);
    });

    it('has correct error message', () => {
      expect(email.message).toBe('Please enter a valid email address');
    });
  });

  describe('phone', () => {
    it('validates 10-digit phone number', () => {
      expect(phone.validate('1234567890')).toBe(true);
    });

    it('validates phone with dashes', () => {
      expect(phone.validate('123-456-7890')).toBe(true);
    });

    it('validates phone with parentheses', () => {
      expect(phone.validate('(123) 456-7890')).toBe(true);
    });

    it('validates phone with country code', () => {
      expect(phone.validate('+1 234 567 8901')).toBe(true);
    });

    it('validates international format', () => {
      expect(phone.validate('+44 20 7946 0958')).toBe(true);
    });

    it('allows empty for optional fields', () => {
      expect(phone.validate('')).toBe(true);
    });

    it('rejects too short numbers', () => {
      expect(phone.validate('123456')).toBe(false);
    });

    it('rejects letters in phone', () => {
      expect(phone.validate('123-ABC-7890')).toBe(false);
    });

    it('has correct error message', () => {
      expect(phone.message).toBe('Please enter a valid phone number');
    });
  });

  describe('password', () => {
    it('accepts passwords with 8+ characters', () => {
      expect(password.validate('password')).toBe(true);
    });

    it('accepts long passwords', () => {
      expect(password.validate('verylongpassword123!@#')).toBe(true);
    });

    it('accepts exactly 8 characters', () => {
      expect(password.validate('12345678')).toBe(true);
    });

    it('rejects passwords under 8 characters', () => {
      expect(password.validate('pass')).toBe(false);
    });

    it('rejects 7 character password', () => {
      expect(password.validate('1234567')).toBe(false);
    });

    it('rejects empty password', () => {
      expect(password.validate('')).toBe(false);
    });

    it('has correct error message', () => {
      expect(password.message).toBe('Password must be at least 8 characters');
    });
  });

  describe('passwordStrength', () => {
    it('accepts password with uppercase, lowercase, and number', () => {
      expect(passwordStrength.validate('Password1')).toBe(true);
    });

    it('accepts complex passwords', () => {
      expect(passwordStrength.validate('MyP@ssw0rd!')).toBe(true);
    });

    it('rejects passwords without uppercase', () => {
      expect(passwordStrength.validate('password1')).toBe(false);
    });

    it('rejects passwords without lowercase', () => {
      expect(passwordStrength.validate('PASSWORD1')).toBe(false);
    });

    it('rejects passwords without numbers', () => {
      expect(passwordStrength.validate('Password')).toBe(false);
    });

    it('rejects short passwords even with all requirements', () => {
      expect(passwordStrength.validate('Pass1')).toBe(false);
    });

    it('has correct error message', () => {
      expect(passwordStrength.message).toBe(
        'Password must contain uppercase, lowercase, and number'
      );
    });
  });

  describe('matchField', () => {
    it('returns true when values match', () => {
      const rule = matchField('password123', 'Passwords');
      expect(rule.validate('password123')).toBe(true);
    });

    it('returns false when values differ', () => {
      const rule = matchField('password123', 'Passwords');
      expect(rule.validate('different')).toBe(false);
    });

    it('is case sensitive', () => {
      const rule = matchField('Password', 'Passwords');
      expect(rule.validate('password')).toBe(false);
    });

    it('has correct error message', () => {
      const rule = matchField('test', 'Passwords');
      expect(rule.message).toBe('Passwords do not match');
    });
  });

  describe('numeric', () => {
    it('accepts numeric strings', () => {
      expect(numeric.validate('12345')).toBe(true);
    });

    it('accepts zero', () => {
      expect(numeric.validate('0')).toBe(true);
    });

    it('accepts large numbers', () => {
      expect(numeric.validate('999999999999')).toBe(true);
    });

    it('rejects decimals', () => {
      expect(numeric.validate('12.34')).toBe(false);
    });

    it('rejects letters', () => {
      expect(numeric.validate('abc')).toBe(false);
    });

    it('rejects mixed', () => {
      expect(numeric.validate('12abc')).toBe(false);
    });

    it('rejects negative sign', () => {
      expect(numeric.validate('-123')).toBe(false);
    });

    it('has correct error message', () => {
      expect(numeric.message).toBe('Please enter numbers only');
    });
  });

  describe('positiveNumber', () => {
    it('accepts positive integers', () => {
      expect(positiveNumber.validate('1')).toBe(true);
    });

    it('accepts positive decimals', () => {
      expect(positiveNumber.validate('100.50')).toBe(true);
    });

    it('accepts small positive numbers', () => {
      expect(positiveNumber.validate('0.01')).toBe(true);
    });

    it('rejects zero', () => {
      expect(positiveNumber.validate('0')).toBe(false);
    });

    it('rejects negative numbers', () => {
      expect(positiveNumber.validate('-5')).toBe(false);
    });

    it('rejects non-numeric', () => {
      expect(positiveNumber.validate('abc')).toBe(false);
    });

    it('has correct error message', () => {
      expect(positiveNumber.message).toBe('Please enter a positive number');
    });
  });

  describe('creditCard', () => {
    it('accepts 16-digit card number', () => {
      expect(creditCard.validate('4242424242424242')).toBe(true);
    });

    it('accepts card with spaces', () => {
      expect(creditCard.validate('4242 4242 4242 4242')).toBe(true);
    });

    it('accepts 13-digit card (Visa)', () => {
      expect(creditCard.validate('4000000000000')).toBe(true);
    });

    it('accepts 15-digit card (Amex)', () => {
      expect(creditCard.validate('378282246310005')).toBe(true);
    });

    it('accepts 19-digit card', () => {
      expect(creditCard.validate('4242424242424242424')).toBe(true);
    });

    it('rejects too short card numbers', () => {
      expect(creditCard.validate('424242424242')).toBe(false);
    });

    it('rejects too long card numbers', () => {
      expect(creditCard.validate('42424242424242424242424242')).toBe(false);
    });

    it('has correct error message', () => {
      expect(creditCard.message).toBe('Please enter a valid card number');
    });
  });

  describe('cvv', () => {
    it('accepts 3-digit CVV', () => {
      expect(cvv.validate('123')).toBe(true);
    });

    it('accepts 4-digit CVV (Amex)', () => {
      expect(cvv.validate('1234')).toBe(true);
    });

    it('rejects 2-digit CVV', () => {
      expect(cvv.validate('12')).toBe(false);
    });

    it('rejects 5-digit CVV', () => {
      expect(cvv.validate('12345')).toBe(false);
    });

    it('rejects letters', () => {
      expect(cvv.validate('abc')).toBe(false);
    });

    it('has correct error message', () => {
      expect(cvv.message).toBe('CVV must be 3 or 4 digits');
    });
  });

  describe('expiryDate', () => {
    it('accepts valid future date', () => {
      expect(expiryDate.validate('12/30')).toBe(true);
    });

    it('accepts current month if not expired', () => {
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear() % 100);
      expect(expiryDate.validate(`${month}/${year}`)).toBe(true);
    });

    it('rejects invalid month 00', () => {
      expect(expiryDate.validate('00/30')).toBe(false);
    });

    it('rejects invalid month 13', () => {
      expect(expiryDate.validate('13/30')).toBe(false);
    });

    it('rejects invalid format without slash', () => {
      expect(expiryDate.validate('1230')).toBe(false);
    });

    it('rejects invalid format with dash', () => {
      expect(expiryDate.validate('12-30')).toBe(false);
    });

    it('has correct error message', () => {
      expect(expiryDate.message).toBe('Please enter a valid expiry date (MM/YY)');
    });
  });

  describe('zipCode', () => {
    it('accepts valid 5-digit zip', () => {
      expect(zipCode.validate('12345')).toBe(true);
    });

    it('accepts valid 9-digit zip with dash', () => {
      expect(zipCode.validate('12345-6789')).toBe(true);
    });

    it('rejects 4-digit zip', () => {
      expect(zipCode.validate('1234')).toBe(false);
    });

    it('rejects 6-digit zip', () => {
      expect(zipCode.validate('123456')).toBe(false);
    });

    it('rejects letters', () => {
      expect(zipCode.validate('ABCDE')).toBe(false);
    });

    it('has correct error message', () => {
      expect(zipCode.message).toBe('Please enter a valid ZIP code');
    });
  });

  describe('url', () => {
    it('accepts https URL', () => {
      expect(url.validate('https://example.com')).toBe(true);
    });

    it('accepts http URL', () => {
      expect(url.validate('http://example.com')).toBe(true);
    });

    it('accepts URL with port', () => {
      expect(url.validate('http://localhost:3000')).toBe(true);
    });

    it('accepts URL with path', () => {
      expect(url.validate('https://example.com/path/to/page')).toBe(true);
    });

    it('accepts URL with query string', () => {
      expect(url.validate('https://example.com?foo=bar')).toBe(true);
    });

    it('allows empty for optional fields', () => {
      expect(url.validate('')).toBe(true);
    });

    it('rejects invalid URLs without protocol', () => {
      expect(url.validate('not-a-url')).toBe(false);
    });

    it('rejects malformed URLs', () => {
      expect(url.validate('http://')).toBe(false);
    });

    it('has correct error message', () => {
      expect(url.message).toBe('Please enter a valid URL (e.g., https://example.com)');
    });
  });
});

describe('validate function', () => {
  it('returns valid for passing all rules', () => {
    const result = validate('hello@example.com', [required('Email'), email]);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('returns first error for failing rules', () => {
    const result = validate('', [required('Email'), email]);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Email is required');
  });

  it('returns second error if first passes', () => {
    const result = validate('invalid', [required('Email'), email]);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Please enter a valid email address');
  });

  it('returns valid for empty rules array', () => {
    const result = validate('anything', []);
    expect(result.isValid).toBe(true);
  });

  it('validates multiple rules in order', () => {
    const result = validate('ab', [
      required('Password'),
      minLength(8, 'Password'),
      passwordStrength,
    ]);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password must be at least 8 characters');
  });
});

describe('validateForm function', () => {
  it('validates entire form successfully', () => {
    const values = {
      email: 'test@example.com',
      password: 'Password1',
    };
    const schema = {
      email: [required('Email'), email],
      password: [required('Password'), passwordStrength],
    };
    const result = validateForm(values, schema);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('returns all errors for invalid form', () => {
    const values = {
      email: '',
      password: 'weak',
    };
    const schema = {
      email: [required('Email')],
      password: [minLength(8, 'Password')],
    };
    const result = validateForm(values, schema);
    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBeDefined();
    expect(result.errors.password).toBeDefined();
  });

  it('handles missing field values', () => {
    const values = {} as { email: string };
    const schema = {
      email: [required('Email')],
    };
    const result = validateForm(values, schema);
    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBe('Email is required');
  });

  it('ignores fields not in schema', () => {
    const values = {
      email: 'test@example.com',
      extra: '',
    };
    const schema = {
      email: [required('Email')],
    };
    const result = validateForm(values, schema);
    expect(result.isValid).toBe(true);
  });

  it('handles partial validation', () => {
    const values = {
      email: 'test@example.com',
      password: '',
    };
    const schema = {
      email: [required('Email'), email],
    };
    const result = validateForm(values, schema);
    expect(result.isValid).toBe(true);
  });
});

describe('Format Helpers', () => {
  describe('formatCreditCard', () => {
    it('formats card number with spaces', () => {
      expect(formatCreditCard('4242424242424242')).toBe('4242 4242 4242 4242');
    });

    it('removes non-digits before formatting', () => {
      expect(formatCreditCard('4242-4242-4242-4242')).toBe('4242 4242 4242 4242');
    });

    it('limits to max length', () => {
      expect(formatCreditCard('42424242424242424242')).toBe('4242 4242 4242 4242');
    });

    it('handles partial input', () => {
      expect(formatCreditCard('4242')).toBe('4242');
      expect(formatCreditCard('42424242')).toBe('4242 4242');
    });

    it('handles empty input', () => {
      expect(formatCreditCard('')).toBe('');
    });

    it('handles single digit', () => {
      expect(formatCreditCard('4')).toBe('4');
    });
  });

  describe('formatExpiryDate', () => {
    it('formats expiry with slash', () => {
      expect(formatExpiryDate('1228')).toBe('12/28');
    });

    it('handles partial input - 2 digits', () => {
      expect(formatExpiryDate('12')).toBe('12/');
    });

    it('handles partial input - 1 digit', () => {
      expect(formatExpiryDate('1')).toBe('1');
    });

    it('handles empty input', () => {
      expect(formatExpiryDate('')).toBe('');
    });

    it('removes non-digits', () => {
      expect(formatExpiryDate('12/28')).toBe('12/28');
    });

    it('limits to 4 digits', () => {
      expect(formatExpiryDate('122899')).toBe('12/28');
    });
  });

  describe('formatPhone', () => {
    it('formats full US phone number', () => {
      expect(formatPhone('1234567890')).toBe('(123) 456-7890');
    });

    it('handles partial input - 3 digits', () => {
      expect(formatPhone('123')).toBe('123');
    });

    it('handles partial input - 4 digits', () => {
      expect(formatPhone('1234')).toBe('(123) 4');
    });

    it('handles partial input - 7 digits', () => {
      expect(formatPhone('1234567')).toBe('(123) 456-7');
    });

    it('handles empty input', () => {
      expect(formatPhone('')).toBe('');
    });

    it('removes non-digits', () => {
      expect(formatPhone('(123) 456-7890')).toBe('(123) 456-7890');
    });

    it('limits to 10 digits', () => {
      expect(formatPhone('12345678901234')).toBe('(123) 456-7890');
    });
  });
});
