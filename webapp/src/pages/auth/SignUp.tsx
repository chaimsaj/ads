import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { Button, Input } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { isApiError } from '../../api/client';
import styles from './Auth.module.css';

export function SignUp() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    agreeToTerms: false,
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await register({
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        password: formData.password,
      });
      navigate('/auth/verify-email');
    } catch (err) {
      if (isApiError(err)) {
        setError(err.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Sign up" subtitle="Create your account">
      {error && <p className={styles.errorText}>{error}</p>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Email Address"
          type="email"
          placeholder="email@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />

        <Input
          label="First Name"
          type="text"
          placeholder="John"
          value={formData.firstName}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          required
        />

        <Input
          label="Last Name"
          type="text"
          placeholder="Doe"
          value={formData.lastName}
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          required
        />

        <div>
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <p className={styles.helperText}>
            Use at least 8 characters with a mix of letters and numbers, uppercase and lowercase.
          </p>
        </div>

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={formData.agreeToTerms}
            onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
            required
          />
          <span>
            By signing up, you agree to our{' '}
            <Link to="/terms" className={styles.link}>
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className={styles.link}>
              Privacy Policy
            </Link>
          </span>
        </label>

        <Button type="submit" variant="secondary" fullWidth disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Continue'}
        </Button>
      </form>

      <div className={styles.footer}>
        <p>
          Already have an account?{' '}
          <Link to="/auth/signin" className={styles.link}>
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
