import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WizardLayout } from '../../components/layout';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import styles from './Campaign.module.css';

type AdFormat = 'banner' | 'interstitial' | 'push';

function saveWizardData(data: Record<string, unknown>) {
  const existing = JSON.parse(localStorage.getItem('campaignWizard') || '{}');
  localStorage.setItem('campaignWizard', JSON.stringify({ ...existing, ...data }));
}

function getWizardData(): Record<string, unknown> {
  try { return JSON.parse(localStorage.getItem('campaignWizard') || '{}'); } catch { return {}; }
}

export function SelectAdFormat() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const existing = getWizardData();
  const [selectedFormat, setSelectedFormat] = useState<AdFormat | null>((existing.adFormat as AdFormat) || null);

  const handleNext = () => {
    saveWizardData({ adFormat: selectedFormat });
    navigate('/campaign/new/create-ad');
  };

  const handleBack = () => {
    navigate('/campaign/new/audience-targeting');
  };

  const adFormats = [
    {
      id: 'banner' as AdFormat,
      title: 'Banner',
      description: 'Display your ad in the events section of the calendar.',
    },
    {
      id: 'interstitial' as AdFormat,
      title: 'Interstitial',
      description: 'Full screen ad that covers the entire interface of the Myngly application.',
    },
    {
      id: 'push' as AdFormat,
      title: 'Push to nearby users',
      description: 'Limit your audience based on location.',
    },
  ];

  return (
    <WizardLayout
      currentStep={2}
      totalSteps={3}
      onBack={handleBack}
      onNext={handleNext}
      nextDisabled={!selectedFormat}
      user={user || { name: '' }}
    >
      <div className={styles.wizardContent}>
        <div className={styles.centeredHeader}>
          <h1 className={styles.pageTitle}>Ad format</h1>
          <p className={styles.pageSubtitle}>
            Choose the Myngly ad format that best suits your business goals.
          </p>
        </div>

        <div className={styles.formatGrid}>
          {adFormats.map((format) => (
            <div
              key={format.id}
              className={`${styles.formatCard} ${selectedFormat === format.id ? styles.selected : ''}`}
              onClick={() => setSelectedFormat(format.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedFormat(format.id);
                }
              }}
            >
              <div className={styles.formatHeader}>
                <h3 className={styles.formatTitle}>{format.title}</h3>
                <div className={`${styles.radio} ${selectedFormat === format.id ? styles.radioSelected : ''}`}>
                  {selectedFormat === format.id && <div className={styles.radioDot} />}
                </div>
              </div>

              <div className={styles.phoneMockup}>
                <div className={styles.phoneScreen}>
                  <div className={styles.phoneHeader}>
                    <span className={styles.phoneLogo}>Calendar</span>
                  </div>
                  <div className={styles.calendarContent}>
                    <div className={styles.eventCard}>
                      <div className={styles.eventImage} />
                      <div className={styles.eventInfo}>
                        <span className={styles.eventTitle}>Ad Preview</span>
                        <span className={styles.eventDesc}>Your ad will appear here...</span>
                      </div>
                    </div>
                  </div>
                  {format.id === 'interstitial' && (
                    <div className={styles.interstitialOverlay}>
                      <div className={styles.interstitialClose}>✕</div>
                      <div className={styles.interstitialContent}>
                        <div className={styles.interstitialImage}>Ad Creative</div>
                        <div className={styles.interstitialText}>
                          Your full-screen ad will appear here, covering the entire app interface
                        </div>
                        <div className={styles.interstitialCta}>Learn More</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <p className={styles.formatDescription}>{format.description}</p>
            </div>
          ))}
        </div>
      </div>
    </WizardLayout>
  );
}
