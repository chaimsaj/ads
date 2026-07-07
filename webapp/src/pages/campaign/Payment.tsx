import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Plus } from 'lucide-react';
import { WizardLayout } from '../../components/layout';
import { Button, FieldError, AlertBanner } from '../../components/ui';
import { stripePaymentsApi, type PaymentMethod } from '../../api';
import { isApiError } from '../../api/client';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import styles from './Payment.module.css';

function saveWizardData(data: Record<string, unknown>) {
  const existing = JSON.parse(localStorage.getItem('campaignWizard') || '{}');
  localStorage.setItem('campaignWizard', JSON.stringify({ ...existing, ...data }));
}

export function Payment() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [budget, setBudget] = useState('100');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState<PaymentMethod[]>([]);
  const [savingCard, setSavingCard] = useState(false);
  const fetchedRef = useRef(false);
  const stripeWindowRef = useRef<Window | null>(null);
  const stripeSessionIdRef = useRef<string | null>(null);

  const loadPaymentMethods = useCallback(async () => {
    try {
      setError(null);
      const methods = await stripePaymentsApi.getPaymentMethods();
      setSavedCards(methods);

      // Auto-select default card
      const defaultCard = methods.find(m => m.isDefault);
      if (defaultCard) {
        setSelectedCard(defaultCard.id);
      } else if (methods.length > 0) {
        setSelectedCard(methods[0].id);
      }
    } catch {
      setError('Failed to load payment methods. Please try again.');
      setSavedCards([]);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const init = async () => {
      setLoading(true);
      await loadPaymentMethods();
      setLoading(false);
    };

    init();
  }, [loadPaymentMethods]);

  // Process checkout session and reload payment methods when user returns from Stripe tab
  const processAndReload = useCallback(async () => {
    const sessionId = stripeSessionIdRef.current;
    if (sessionId) {
      stripeSessionIdRef.current = null;
      setSavingCard(true);
      try {
        await stripePaymentsApi.processCheckoutSession(sessionId);
      } catch {
        // Webhook may have already processed it — continue to reload
      } finally {
        setSavingCard(false);
      }
    }
    await loadPaymentMethods();
  }, [loadPaymentMethods]);

  useEffect(() => {
    const handleReturn = () => {
      // Process whenever user returns to tab if there's a pending session
      if (stripeSessionIdRef.current) {
        processAndReload();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleReturn();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleReturn);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleReturn);
    };
  }, [processAndReload]);

  const budgetError = budget && parseFloat(budget) < 10 ? 'Minimum budget is $10.' : undefined;

  const handleSubmit = async () => {
    if (!selectedCard || !budget || parseFloat(budget) < 10) return;

    setProcessing(true);
    setError(null);

    try {
      // Look up Stripe payment method ID from selected card
      const card = savedCards.find(c => c.id === selectedCard);
      if (!card?.stripePaymentMethodId) {
        setError('Selected payment method is invalid. Please try another card.');
        return;
      }
      const stripeMethodId = card.stripePaymentMethodId;

      // Create payment intent
      const paymentIntent = await stripePaymentsApi.createPaymentIntent({
        amount: Math.round(parseFloat(budget) * 1.05 * 100), // Convert to cents, include fee
        currency: 'usd',
        paymentMethodId: stripeMethodId,
        description: 'Campaign budget',
      });

      // Confirm payment
      await stripePaymentsApi.confirmPayment(paymentIntent.id, {
        paymentMethodId: stripeMethodId,
      });

      // Save payment info to wizard data
      const cardLabel = card?.card
        ? `${card.card.brand} •••• ${card.card.last4}`
        : 'Card on file';

      saveWizardData({
        budget,
        paymentMethodId: selectedCard,
        paymentMethodLabel: cardLabel,
      });

      // Navigate to review page
      navigate('/campaign/new/review');
    } catch (err) {
      const message = isApiError(err) ? err.message
        : err instanceof Error ? err.message
        : 'Payment processing failed. Please try again.';
      setError(message);
    } finally {
      setProcessing(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleAddCardClick = async () => {
    try {
      setError(null);
      const { url, sessionId } = await stripePaymentsApi.createCheckoutSessionSetup({
        successUrl: `${window.location.origin}/stripe-success`,
        cancelUrl: `${window.location.origin}/stripe-success`,
      });
      // Store session ID so we can process it when the user returns
      stripeSessionIdRef.current = sessionId;
      // Open Stripe in a new tab to preserve auth state in this tab
      stripeWindowRef.current = window.open(url, '_blank');
    } catch {
      setError('Failed to initialize payment setup. Please try again.');
    }
  };

  const formatCardExpiry = (expMonth: number, expYear: number): string => {
    return `${String(expMonth).padStart(2, '0')}/${String(expYear).slice(-2)}`;
  };

  return (
    <WizardLayout
      currentStep={3}
      totalSteps={3}
      onBack={handleBack}
      onNext={handleSubmit}
      nextLabel={processing ? 'Processing...' : 'Submit Campaign'}
      nextDisabled={!selectedCard || !budget || !!budgetError || processing}
      user={user || { name: '' }}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Payment</h1>
          <p className={styles.subtitle}>
            Select your payment method and set your campaign budget.
          </p>
        </div>

        {error && <AlertBanner message={error} />}

        {savingCard && (
          <div className={styles.pollingAlert}>
            Saving your new card...
          </div>
        )}

        <div className={styles.sections}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Budget</h2>
            <p className={styles.sectionDesc}>
              Set the total amount you want to spend on this campaign.
            </p>

            <div className={styles.budgetInput}>
              <span className={styles.currency}>$</span>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className={styles.budgetField}
                min="10"
                step="10"
                disabled={processing}
              />
              <span className={styles.budgetSuffix}>USD</span>
            </div>
            {budgetError && <FieldError message={budgetError} />}

            <div className={styles.budgetPresets}>
              {['50', '100', '250', '500'].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  className={`${styles.presetBtn} ${budget === amount ? styles.active : ''}`}
                  onClick={() => setBudget(amount)}
                  disabled={processing}
                >
                  ${amount}
                </button>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Payment Method</h2>
                <p className={styles.sectionDesc}>
                  Select a saved card or add a new one.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Plus size={16} />}
                onClick={handleAddCardClick}
                disabled={processing}
              >
                Add Card
              </Button>
            </div>

            {loading ? (
              <div className={styles.loadingState}>Loading payment methods...</div>
            ) : (
              <div className={styles.cardList}>
                {savedCards.length === 0 ? (
                  <p className={styles.emptyState}>
                    No saved cards. Add a payment method to continue.
                  </p>
                ) : (
                  savedCards.map((card) => (
                    <label
                      key={card.id}
                      className={`${styles.cardOption} ${selectedCard === card.id ? styles.selected : ''}`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={card.id}
                        checked={selectedCard === card.id}
                        onChange={() => setSelectedCard(card.id)}
                        className={styles.radioInput}
                        disabled={processing}
                      />
                      <div className={styles.cardIcon}>
                        <CreditCard size={24} />
                      </div>
                      <div className={styles.cardInfo}>
                        <span className={styles.cardBrand}>
                          {card.card?.brand || 'Card'}
                        </span>
                        <span className={styles.cardNumber}>
                          &bull;&bull;&bull;&bull; {card.card?.last4 || '****'}
                        </span>
                      </div>
                      <span className={styles.cardExpiry}>
                        Expires {card.card ? formatCardExpiry(card.card.expMonth, card.card.expYear) : '--/--'}
                      </span>
                      {card.isDefault && (
                        <span className={styles.defaultBadge}>Default</span>
                      )}
                    </label>
                  ))
                )}
              </div>
            )}
          </section>

          <section className={styles.summary}>
            <h3 className={styles.summaryTitle}>Order Summary</h3>
            <div className={styles.summaryRow}>
              <span>Campaign Budget</span>
              <span>${budget}.00</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Service Fee (5%)</span>
              <span>${(parseFloat(budget || '0') * 0.05).toFixed(2)}</span>
            </div>
            <div className={`${styles.summaryRow} ${styles.total}`}>
              <span>Total</span>
              <span>${(parseFloat(budget || '0') * 1.05).toFixed(2)}</span>
            </div>
            <p className={styles.stripeNote}>
              Payments are securely processed by Stripe.
            </p>
          </section>
        </div>
      </div>
    </WizardLayout>
  );
}
