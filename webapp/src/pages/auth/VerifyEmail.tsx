import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { Button } from '../../components/ui';
import { sendGridEmailsApi, authApi, isApiError } from '../../api';
import { useAuth } from '../../context/AuthContext';
import styles from './Auth.module.css';

export function VerifyEmail() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Get email from URL params or localStorage
  const email = searchParams.get('email') || localStorage.getItem('verifyEmail') || 'your email';

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const digits = pastedData.split('').filter(char => /\d/.test(char));

    const newCode = [...code];
    digits.forEach((digit, index) => {
      if (index < 6) newCode[index] = digit;
    });
    setCode(newCode);

    // Focus the next empty input or the last one
    const nextEmptyIndex = newCode.findIndex(d => !d);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    const inputToFocus = document.getElementById(`code-${focusIndex}`);
    inputToFocus?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');

    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    if (!email || email === 'your email') {
      setError('We could not determine which email to verify. Please sign in again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authApi.verifyEmail(email, fullCode);
      localStorage.removeItem('verifyEmail');
      await refreshProfile();
      navigate('/dashboard');
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (cooldown > 0) return;

    setResending(true);
    setError(null);
    setResendSuccess(false);

    try {
      await sendGridEmailsApi.resendVerificationEmail({ email });
      setResendSuccess(true);
      setCooldown(60); // 60 second cooldown
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout title="Just one more step" subtitle="Verify your email">
      <div className={styles.verifyContent}>
        <p className={styles.verifyText}>
          We've sent a 6-digit code to <strong>{email}</strong>
          <br />
          Enter it below to continue.
        </p>

        <p className={styles.securityNote}>
          For security reasons, the code will expire in 30 minutes.
          <br />
          Keep this window open while checking your code.
        </p>

        {error && (
          <div className={styles.errorAlert}>
            {error}
          </div>
        )}

        {resendSuccess && (
          <div className={styles.successAlert}>
            A new verification code has been sent to your email.
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.verifyForm}>
          <div className={styles.codeInputs}>
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className={styles.codeInput}
                disabled={loading}
              />
            ))}
          </div>

          <Button type="submit" variant="secondary" fullWidth disabled={loading}>
            {loading ? 'Verifying...' : 'Verify'}
          </Button>
        </form>

        <div className={styles.resendSection}>
          <p>Didn't receive an email?</p>
          <p>
            Check your spam folder. Still didn't get the code?{' '}
            <button
              className={styles.linkBtn}
              onClick={handleResendCode}
              disabled={resending || cooldown > 0}
            >
              {resending
                ? 'Sending...'
                : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : 'Resend the code'}
            </button>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
