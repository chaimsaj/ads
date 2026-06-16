import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '../../components/ui';
import { loginSchema, validateForm } from '../../utils/validation';
import styles from './Login.module.css';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    setErrors({});

    if (!requiresTwoFactor) {
      const validation = validateForm(loginSchema, { email, password });
      if (!validation.success) {
        setErrors(validation.errors);
        return;
      }
    }

    setIsLoading(true);

    try {
      const result = await login(email, password, totpCode || undefined);

      if (result.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setIsLoading(false);
        return;
      }

      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setApiError(result.error || 'Login failed');
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>M</div>
          <span className={styles.logoText}>Myngly Admin</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {requiresTwoFactor ? 'Two-Factor Authentication' : 'Sign In'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className={styles.form}>
              {apiError && (
                <div className={styles.error}>{apiError}</div>
              )}

              {!requiresTwoFactor ? (
                <>
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={errors.email}
                    placeholder="admin@myngly.com"
                    disabled={isLoading}
                    leftIcon={<Mail size={18} />}
                  />

                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={errors.password}
                    placeholder="Enter your password"
                    disabled={isLoading}
                    leftIcon={<Lock size={18} />}
                    rightIcon={
                      <button
                        type="button"
                        className={styles.passwordToggle}
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    }
                  />
                </>
              ) : (
                <div className={styles.twoFactorSection}>
                  <div className={styles.twoFactorIcon}>
                    <Shield size={48} />
                  </div>
                  <p className={styles.twoFactorText}>
                    Enter the 6-digit code from your authenticator app
                  </p>
                  <div className={styles.codeInputWrapper}>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="000000"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      autoFocus
                      className={styles.codeInput}
                    />
                  </div>
                  <button
                    type="button"
                    className={styles.backLink}
                    onClick={() => {
                      setRequiresTwoFactor(false);
                      setTotpCode('');
                      setApiError('');
                    }}
                  >
                    Use a different account
                  </button>
                </div>
              )}

              <Button
                type="submit"
                fullWidth
                loading={isLoading}
              >
                {isLoading
                  ? 'Signing in...'
                  : requiresTwoFactor
                  ? 'Verify'
                  : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
