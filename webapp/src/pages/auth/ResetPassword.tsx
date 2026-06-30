import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { Button, Input } from '../../components/ui';
import { authApi, isApiError } from '../../api';
import styles from './Auth.module.css';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('This reset link is invalid or has expired. Please request a new one.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(
        isApiError(err)
          ? err.message
          : 'We could not reset your password. The link may have expired — request a new one.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthLayout title="Password updated" subtitle="">
        <div className={styles.checkEmailContent}>
          <h2 className={styles.checkEmailTitle}>Your password has been reset</h2>
          <p className={styles.checkEmailText}>
            You can now sign in with your new password.
          </p>
          <Link to="/auth/signin">
            <Button variant="secondary" fullWidth>
              Go to sign in
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset password" subtitle="Choose a new password">
      <div className={styles.forgotContent}>
        <p className={styles.forgotText}>
          Enter a new password for your account. For your security, the reset link expires one hour
          after it was requested.
        </p>

        {error && <div className={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            disabled={loading}
          />

          <Button type="submit" variant="secondary" fullWidth disabled={loading}>
            {loading ? 'Saving...' : 'Reset password'}
          </Button>
        </form>

        <div className={styles.footer}>
          <p>
            Remembered your password?{' '}
            <Link to="/auth/signin" className={styles.link}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
