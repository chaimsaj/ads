import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, Building } from 'lucide-react';
import { WizardLayout } from '../../components/layout';
import { Input, SelectionCard } from '../../components/ui';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import styles from './Campaign.module.css';

type AdType = 'user' | 'event' | 'brand';

function saveWizardData(data: Record<string, unknown>) {
  const existing = JSON.parse(localStorage.getItem('campaignWizard') || '{}');
  localStorage.setItem('campaignWizard', JSON.stringify({ ...existing, ...data }));
}

function getWizardData(): Record<string, unknown> {
  try { return JSON.parse(localStorage.getItem('campaignWizard') || '{}'); } catch { return {}; }
}

export function SelectAdType() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const existing = getWizardData();
  const [campaignName, setCampaignName] = useState((existing.name as string) || '');
  const [selectedType, setSelectedType] = useState<AdType | null>((existing.adType as AdType) || null);

  const handleNext = () => {
    saveWizardData({ name: campaignName, adType: selectedType });
    if (selectedType === 'user') {
      navigate('/campaign/new/search-user');
    } else if (selectedType === 'event') {
      navigate('/campaign/new/search-event');
    } else {
      navigate('/campaign/new/brand-details');
    }
  };

  const adTypes = [
    {
      id: 'user' as AdType,
      title: 'Spotlighted User',
      description: 'Promote yourself to increase connection and visibility.',
      icon: <User size={48} />,
    },
    {
      id: 'event' as AdType,
      title: 'Featured Event',
      description: 'Attract more attendees to your event.',
      icon: <Calendar size={48} />,
    },
    {
      id: 'brand' as AdType,
      title: 'Promote your Brand',
      description: 'Boost visibility for your business or organization.',
      icon: <Building size={48} />,
    },
  ];

  return (
    <WizardLayout
      currentStep={1}
      totalSteps={3}
      onNext={handleNext}
      nextDisabled={!campaignName || !selectedType}
      user={user || { name: '' }}
    >
      <div className={styles.wizardContent}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Campaign name</h2>
          <div className={styles.inputWrapper}>
            <Input
              placeholder="Enter campaign name"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              maxLength={200}
            />
            <span className={styles.charCount}>{campaignName.length}/200</span>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>What would you like to promote?</h2>
          <p className={styles.sectionSubtitle}>
            Select what you want to promote to help us reach the right audience.
          </p>

          <div className={styles.selectionGrid}>
            {adTypes.map((type) => (
              <SelectionCard
                key={type.id}
                title={type.title}
                description={type.description}
                icon={type.icon}
                selected={selectedType === type.id}
                onSelect={() => setSelectedType(type.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </WizardLayout>
  );
}
