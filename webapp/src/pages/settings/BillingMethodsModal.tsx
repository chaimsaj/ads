import { useState, useEffect, useRef, useCallback } from 'react';
import { CreditCard, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui';
import { stripePaymentsApi, type PaymentMethod } from '../../api';
import styles from './Settings.module.css';

interface BillingMethodsModalProps {
  onClose: () => void;
  sessionId?: string | null;
}

export function BillingMethodsModal({ onClose, sessionId = null }: BillingMethodsModalProps) {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<PaymentMethod[]>([]);
  const fetchedRef = useRef(false);

  const loadPaymentMethods = useCallback(async () => {
    try {
      setError(null);
      const methods = await stripePaymentsApi.getPaymentMethods();
      setCards(methods);
    } catch {
      setError('Failed to load payment methods');
    }
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const init = async () => {
      setLoading(true);

      // If returning from Stripe Checkout, process the session first
      if (sessionId) {
        setProcessing(true);
        try {
          await stripePaymentsApi.processCheckoutSession(sessionId);
        } catch {
          setError('Failed to save your new card. Please try again.');
        } finally {
          setProcessing(false);
        }
      }

      await loadPaymentMethods();
      setLoading(false);
    };

    init();
  }, [loadPaymentMethods, sessionId]);

  const handleAddCardClick = async () => {
    try {
      setError(null);
      const { url } = await stripePaymentsApi.createCheckoutSessionSetup({
        successUrl: `${window.location.origin}/settings?payment_method_added=true`,
        cancelUrl: `${window.location.origin}/settings?payment_method_cancelled=true`,
      });
      window.location.href = url;
    } catch {
      setError('Failed to initialize payment setup. Please try again.');
    }
  };

  const handleRemoveCard = async (paymentMethodId: string) => {
    try {
      setError(null);
      await stripePaymentsApi.removePaymentMethod(paymentMethodId);
      setCards(cards.filter(c => c.id !== paymentMethodId));
    } catch {
      setError('Failed to remove payment method');
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      setError(null);
      await stripePaymentsApi.setDefaultPaymentMethod(paymentMethodId);
      setCards(cards.map(c => ({
        ...c,
        isDefault: c.id === paymentMethodId,
      })));
    } catch {
      setError('Failed to set default payment method');
    }
  };

  const formatCardExpiry = (expMonth: number, expYear: number): string => {
    return `${String(expMonth).padStart(2, '0')}/${String(expYear).slice(-2)}`;
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>&times;</button>

        <h2 className={styles.modalTitle}>Billing Methods</h2>
        <p className={styles.modalDesc}>
          Manage your saved payment methods.
        </p>

        {error && (
          <div className={styles.errorAlert}>
            {error}
          </div>
        )}

        {processing && (
          <div className={styles.successAlert}>
            Saving your new card...
          </div>
        )}

        {loading ? (
          <div className={styles.loadingState}>Loading payment methods...</div>
        ) : (
          <div className={styles.modalForm}>
            <div className={styles.cardList}>
              {cards.length === 0 ? (
                <p className={styles.emptyState}>No payment methods saved</p>
              ) : (
                cards.map((card) => (
                  <div key={card.id} className={styles.cardItem}>
                    <div className={styles.cardIcon}>
                      <CreditCard size={20} />
                    </div>
                    <div className={styles.cardDetails}>
                      <span className={styles.cardBrand}>
                        {card.card?.brand || 'Card'}
                      </span>
                      <span className={styles.cardNumber}>
                        &bull;&bull;&bull;&bull; {card.card?.last4 || '****'} &middot; {
                          card.card ? formatCardExpiry(card.card.expMonth, card.card.expYear) : '--/--'
                        }
                      </span>
                    </div>
                    {card.isDefault && (
                      <span className={styles.defaultBadge}>Default</span>
                    )}
                    {!card.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(card.id)}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCard(card.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className={styles.modalActions}>
              <Button
                variant="outline"
                leftIcon={<Plus size={16} />}
                onClick={handleAddCardClick}
              >
                Add New Card
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
