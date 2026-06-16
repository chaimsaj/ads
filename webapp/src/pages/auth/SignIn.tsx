import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { Button, Input } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { isApiError } from '../../api/client';
import styles from './Auth.module.css';

export function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      if (isApiError(err)) {
        setError(err.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Sign in" subtitle="Welcome back">
      <div className={styles.socialButtons}>
        <button className={styles.socialBtn}>
          <FacebookIcon />
          Sign in with Facebook
        </button>
        <button className={styles.socialBtnGoogle}>
          <GoogleIcon />
          Sign in with Google
        </button>
      </div>

      <div className={styles.divider}>
        <span>or</span>
      </div>

      {error && <p className={styles.errorText}>{error}</p>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Email"
          type="email"
          placeholder="email@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />

        <Button type="submit" variant="secondary" fullWidth disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <div className={styles.footer}>
        <p>
          Don't have an account?{' '}
          <Link to="/auth/signup" className={styles.link}>
            Sign up
          </Link>
        </p>
        <Link to="/auth/forgot-password" className={styles.link}>
          Forgot password?
        </Link>
      </div>
    </AuthLayout>
  );
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M18.896 0H1.104C.494 0 0 .494 0 1.104v17.792C0 19.506.494 20 1.104 20h9.579v-7.745H8.076V9.237h2.606V7.01c0-2.583 1.578-3.99 3.883-3.99 1.104 0 2.052.082 2.329.119v2.7h-1.598c-1.254 0-1.496.596-1.496 1.47v1.927h2.989l-.39 3.018h-2.6V20h5.098c.608 0 1.102-.494 1.102-1.104V1.104C20 .494 19.506 0 18.896 0z"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20">
      <path fill="#4285F4" d="M19.6 10.2c0-.7-.1-1.4-.2-2H10v3.8h5.4c-.2 1.2-.9 2.2-1.9 2.9v2.4h3.1c1.8-1.7 2.9-4.1 2.9-7.1z"/>
      <path fill="#34A853" d="M10 20c2.6 0 4.8-.9 6.4-2.4l-3.1-2.4c-.9.6-2 .9-3.3.9-2.5 0-4.7-1.7-5.4-4H1.4v2.5C3 17.4 6.2 20 10 20z"/>
      <path fill="#FBBC05" d="M4.6 12c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V5.5H1.4C.5 7.3 0 9.1 0 10s.5 2.7 1.4 4.5l3.2-2.5z"/>
      <path fill="#EA4335" d="M10 4c1.4 0 2.7.5 3.7 1.4l2.8-2.8C14.7 1 12.6 0 10 0 6.2 0 3 2.6 1.4 6.5l3.2 2.5C5.3 5.7 7.5 4 10 4z"/>
    </svg>
  );
}
