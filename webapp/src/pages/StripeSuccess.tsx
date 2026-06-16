import { useEffect } from 'react';
import styles from './StripeSuccess.module.css';

export function StripeSuccess() {
  useEffect(() => {
    // Auto-close after a short delay so the user sees the message
    const timer = setTimeout(() => {
      window.close();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.checkmark}>&#10003;</div>
        <h1 className={styles.title}>Card Added</h1>
        <p className={styles.message}>
          Your payment method has been saved. This tab will close automatically.
        </p>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={() => window.close()}
        >
          Close this tab
        </button>
      </div>
    </div>
  );
}
