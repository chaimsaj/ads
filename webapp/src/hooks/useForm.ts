import { useState, useCallback } from 'react';
import type { ValidationRule, FormErrors } from '../utils/validation';
import { validate } from '../utils/validation';

interface UseFormOptions<T> {
  initialValues: T;
  validationSchema?: Partial<Record<keyof T, ValidationRule[]>>;
  onSubmit?: (values: T) => void | Promise<void>;
}

interface UseFormReturn<T> {
  values: T;
  errors: FormErrors<T>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  handleChange: (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (field: keyof T) => () => void;
  setFieldValue: (field: keyof T, value: string) => void;
  setFieldError: (field: keyof T, error: string) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  resetForm: () => void;
  validateField: (field: keyof T) => boolean;
  validateForm: () => boolean;
}

export function useForm<T extends Record<string, string>>({
  initialValues,
  validationSchema = {},
  onSubmit,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback(
    (field: keyof T): boolean => {
      const rules = validationSchema[field];
      if (!rules) return true;

      const result = validate(values[field] || '', rules);
      setErrors((prev) => ({
        ...prev,
        [field]: result.error,
      }));
      return result.isValid;
    },
    [values, validationSchema]
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors<T> = {};
    let isValid = true;

    for (const field of Object.keys(validationSchema) as (keyof T)[]) {
      const rules = validationSchema[field];
      if (rules) {
        const result = validate(values[field] || '', rules);
        if (!result.isValid) {
          isValid = false;
          newErrors[field] = result.error;
        }
      }
    }

    setErrors(newErrors);
    // Mark all fields as touched
    const allTouched: Partial<Record<keyof T, boolean>> = {};
    for (const field of Object.keys(values) as (keyof T)[]) {
      allTouched[field] = true;
    }
    setTouched(allTouched);

    return isValid;
  }, [values, validationSchema]);

  const handleChange = useCallback(
    (field: keyof T) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { value } = e.target;
        setValues((prev) => ({ ...prev, [field]: value }));

        // Clear error when user starts typing
        if (errors[field]) {
          setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
      },
    [errors]
  );

  const handleBlur = useCallback(
    (field: keyof T) => () => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      validateField(field);
    },
    [validateField]
  );

  const setFieldValue = useCallback((field: keyof T, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      const isValid = validateForm();
      if (!isValid) return;

      if (onSubmit) {
        setIsSubmitting(true);
        try {
          await onSubmit(values);
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [validateForm, onSubmit, values]
  );

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const isValid = Object.values(errors).every((error) => !error);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldError,
    handleSubmit,
    resetForm,
    validateField,
    validateForm,
  };
}
