import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WizardLayout } from '../../components/layout';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import styles from './Campaign.module.css';

type BoostType = 'standard' | 'premium';

function saveWizardData(data: Record<string, unknown>) {
  const existing = JSON.parse(localStorage.getItem('campaignWizard') || '{}');
  localStorage.setItem('campaignWizard', JSON.stringify({ ...existing, ...data }));
}

function getWizardData(): Record<string, unknown> {
  try { return JSON.parse(localStorage.getItem('campaignWizard') || '{}'); } catch { return {}; }
}

export function SelectBoostType() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const existing = getWizardData();
  const [selectedType, setSelectedType] = useState<BoostType | null>((existing.boostType as BoostType) || null);

  const handleNext = () => {
    saveWizardData({ boostType: selectedType });
    const adType = existing.adType as string;
    if (adType === 'user') {
      navigate('/campaign/new/user-ad-preview');
    } else {
      navigate('/campaign/new/create-ad');
    }
  };

  const handleBack = () => {
    const adType = existing.adType as string;
    if (adType === 'user') {
      navigate('/campaign/new/audience-targeting');
    } else {
      navigate('/campaign/new/search-user');
    }
  };

  const boostTypes = [
    {
      id: 'standard' as BoostType,
      title: 'Standard Boost',
      description: 'Show up at the top of the Network tab.',
      note: 'Your profile will be labeled "Sponsored" and appear in the main feed of the Network tab.',
    },
    {
      id: 'premium' as BoostType,
      title: 'Premium Boost',
      description: 'Get featured and go further.',
      note: 'Appear in both the Network feed and the horizontal Featured carousel — without the "Sponsored" label.',
    },
  ];

  return (
    <WizardLayout
      currentStep={2}
      totalSteps={3}
      onBack={handleBack}
      onNext={handleNext}
      nextDisabled={!selectedType}
      user={user || { name: '' }}
    >
      <div className={styles.wizardContent}>
        <div className={styles.centeredHeader}>
          <h1 className={styles.pageTitle}>Select Boost Type</h1>
          <p className={styles.pageSubtitle}>
            Choose how you want your profile to appear in the app. Each option helps you reach the right audience with the visibility you need.
          </p>
        </div>

        <div className={styles.boostGrid}>
          {boostTypes.map((type) => (
            <div
              key={type.id}
              className={`${styles.boostCard} ${selectedType === type.id ? styles.selected : ''}`}
              onClick={() => setSelectedType(type.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedType(type.id);
                }
              }}
            >
              <div className={styles.boostHeader}>
                <h3 className={styles.boostTitle}>{type.title}</h3>
                <div className={`${styles.radio} ${selectedType === type.id ? styles.radioSelected : ''}`}>
                  {selectedType === type.id && <div className={styles.radioDot} />}
                </div>
              </div>
              <p className={styles.boostDescription}>{type.description}</p>

              <div className={styles.phoneMockup}>
                <div className={styles.phoneScreen}>
                  <div className={styles.phoneHeader}>
                    <span className={styles.phoneLogo}>myngly</span>
                  </div>
                  {type.id === 'premium' && (
                    <div className={styles.featuredSection}>
                      <span className={styles.featuredLabel}>Featured Connections</span>
                    </div>
                  )}
                  <div className={styles.profileCard}>
                    <div className={styles.profileAvatar} />
                    <div className={styles.profileInfo}>
                      <span className={styles.profileName}>{user?.name?.split(' ')[0] || 'You'}</span>
                      <span className={styles.profileRole}>Your profile</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className={styles.boostNote}>{type.note}</p>
            </div>
          ))}
        </div>
      </div>
    </WizardLayout>
  );
}
