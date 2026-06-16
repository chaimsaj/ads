import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WizardLayout } from '../../components/layout';
import { Input } from '../../components/ui';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import styles from './BrandDetails.module.css';

function getWizardData(): Record<string, unknown> {
  try { return JSON.parse(localStorage.getItem('campaignWizard') || '{}'); } catch { return {}; }
}

function saveWizardData(data: Record<string, unknown>) {
  const existing = JSON.parse(localStorage.getItem('campaignWizard') || '{}');
  localStorage.setItem('campaignWizard', JSON.stringify({ ...existing, ...data }));
}

export function BrandDetails() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const existing = getWizardData();
  const [brandName, setBrandName] = useState((existing.brandName as string) || '');
  const [tagline, setTagline] = useState((existing.brandTagline as string) || '');

  const handleNext = () => {
    saveWizardData({ brandName, brandTagline: tagline });
    navigate('/campaign/new/audience-targeting');
  };

  const handleBack = () => {
    navigate('/campaign/new');
  };

  return (
    <WizardLayout
      currentStep={1}
      totalSteps={3}
      onBack={handleBack}
      onNext={handleNext}
      nextDisabled={!brandName.trim()}
      user={user || { name: '' }}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Which brand would you like to promote?</h1>
          <p className={styles.subtitle}>
            Let us know who you are. You'll upload visuals and links later.
          </p>
        </div>

        <div className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Brand name</label>
            <Input
              placeholder="Enter your brand or company name"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Short tagline or description (optional)</label>
            <Input
              placeholder="e.g. Connecting professionals worldwide"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
            />
          </div>
        </div>
      </div>
    </WizardLayout>
  );
}
