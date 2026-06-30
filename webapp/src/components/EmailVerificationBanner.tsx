import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sendGridEmailsApi } from '../api';
import styles from './EmailVerificationBanner.module.css';

/**
 * Soft email-verification reminder. Rendered for signed-in advertisers whose email is not yet
 * verified — it never blocks the app, it just nudges and offers a quick path to verify or resend.
 */
export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [resending, setResending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!user || user.emailVerified) {
    return null;
  }

  const handleResend = async () => {
    setResending(true);
    try {
      await sendGridEmailsApi.resendVerificationEmail({ email: user.email });
      setSent(true);
    } catch {
      // Stay quiet on failure — the user can retry from the verify page.
    } finally {
      setResending(false);
    }
  };

  return (
    <div className={styles.banner} role="status">
      <span className={styles.icon} aria-hidden="true">!</span>
      <p className={styles.text}>
        Your email isn't verified yet. Verify it to keep your account secure.
      </p>
      <div className={styles.actions}>
        <Link
          to={`/auth/verify-email?email=${encodeURIComponent(user.email)}`}
          className={styles.verifyLink}
        >
          Verify now
        </Link>
        <button
          type="button"
          className={styles.resendBtn}
          onClick={handleResend}
          disabled={resending || sent}
        >
          {sent ? 'Code sent' : resending ? 'Sending…' : 'Resend code'}
        </button>
      </div>
    </div>
  );
}
