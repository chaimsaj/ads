import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { Button, Input } from '../../components/ui';
import { sendGridEmailsApi } from '../../api';
import styles from './Auth.module.css';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await sendGridEmailsApi.requestPasswordReset({ email });
      setSubmitted(true);
    } catch (err) {
      // Still show success to prevent email enumeration attacks
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthLayout title="Check your email" subtitle="">
        <div className={styles.checkEmailContent}>
          <div className={styles.emailIcon}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="8" fill="#90DDF0"/>
              <path
                d="M12 16L24 26L36 16M12 32V16H36V32H12Z"
                stroke="#07393C"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h2 className={styles.checkEmailTitle}>Check your email</h2>

          <p className={styles.checkEmailText}>
            We've sent a link to reset your password to:
            <br />
            <strong>{email}</strong>
          </p>

          <p className={styles.checkEmailNote}>
            Click the link in the email to reset your password.
            The link will expire in 1 hour.
          </p>

          <Link to="/auth/signin">
            <Button variant="secondary" fullWidth>
              Back to login
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot password?" subtitle="Recover your account">
      <div className={styles.forgotContent}>
        <p className={styles.forgotText}>
          Enter your email and we'll send you a link to reset your password.
        </p>

        {error && (
          <div className={styles.errorAlert}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Email Address"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />

          <Button type="submit" variant="secondary" fullWidth disabled={loading}>
            {loading ? 'Sending...' : 'Send reset link'}
          </Button>
        </form>

        <div className={styles.footer}>
          <p>
            Remember your password?{' '}
            <Link to="/auth/signin" className={styles.link}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
