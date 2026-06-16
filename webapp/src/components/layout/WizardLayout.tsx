import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Header } from './Header';
import { Button } from '../ui';
import styles from './WizardLayout.module.css';

interface WizardLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  nextDisabled?: boolean;
  hideBackButton?: boolean;
  user: {
    name: string;
    avatar?: string;
  };
}

export function WizardLayout({
  children,
  currentStep,
  totalSteps,
  onBack,
  onNext,
  nextLabel = 'Next',
  backLabel = 'Back',
  nextDisabled = false,
  hideBackButton = false,
  user,
}: WizardLayoutProps) {
  return (
    <div className={styles.layout}>
      <Header variant="wizard" title="Advertise on Myngly" user={user} />

      <main className={styles.main}>
        <div className={styles.content}>
          {children}
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.progressBar}>
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`${styles.progressStep} ${
                index < currentStep ? styles.completed : ''
              } ${index === currentStep - 1 ? styles.current : ''}`}
            />
          ))}
        </div>

        <div className={styles.actions}>
          {!hideBackButton && (
            onBack ? (
              <button onClick={onBack} className={styles.backLink}>
                {backLabel}
              </button>
            ) : (
              <Link to="/dashboard" className={styles.backLink}>
                {backLabel}
              </Link>
            )
          )}
          {hideBackButton && <div />}

          <Button
            variant="primary"
            size="lg"
            onClick={onNext}
            disabled={nextDisabled}
          >
            {nextLabel}
          </Button>
        </div>
      </footer>
    </div>
  );
}
