import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, Building } from 'lucide-react';
import { WizardLayout } from '../../components/layout';
import { Input, SelectionCard, Button } from '../../components/ui';
import { TargetPickerModal } from '../../components/campaign';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import {
  getWizardData,
  saveWizardData,
  clearOtherTypeFields,
  type AdType,
  type CampaignWizardData,
} from '../../hooks/useCampaignWizard';
import type { UserSearchResult } from '../../api/users';
import type { EventSearchResult } from '../../api/events';
import styles from './Campaign.module.css';

type Target = UserSearchResult | EventSearchResult;

function isUserTarget(target: Target): target is UserSearchResult {
  return 'company' in target;
}

function targetFromWizardData(data: CampaignWizardData): Target | null {
  if (data.adType === 'user' && data.spotlightUserId && data.spotlightUsername) {
    return {
      id: data.spotlightUserId,
      name: data.spotlightUsername,
      company: data.spotlightUserCompany || null,
      avatar: data.spotlightUserAvatar || null,
    };
  }
  if (data.adType === 'event' && data.eventId && data.eventName) {
    return {
      id: data.eventId,
      code: data.eventCode || 0,
      name: data.eventName,
      address: data.eventAddress || null,
      date: data.eventDate || '',
      bannerImage: data.eventBannerImage || null,
    };
  }
  return null;
}

export function SelectAdType() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const existing = getWizardData();
  const [campaignName, setCampaignName] = useState(existing.name || '');
  const [selectedType, setSelectedType] = useState<AdType | null>(existing.adType || null);
  const [target, setTarget] = useState<Target | null>(targetFromWizardData(existing));
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleSelectType = (type: AdType) => {
    if (type !== selectedType) {
      clearOtherTypeFields(type);
      setTarget(targetFromWizardData(getWizardData()));
    }
    setSelectedType(type);
  };

  const handleNext = () => {
    saveWizardData({
      name: campaignName,
      adType: selectedType || undefined,
      ...(selectedType === 'user' && target && isUserTarget(target)
        ? {
            spotlightUserId: target.id,
            spotlightUsername: target.name,
            spotlightUserCompany: target.company || '',
            spotlightUserAvatar: target.avatar || '',
          }
        : {}),
      ...(selectedType === 'event' && target && !isUserTarget(target)
        ? {
            eventId: target.id,
            eventCode: target.code,
            eventName: target.name,
            eventAddress: target.address || '',
            eventDate: target.date,
            eventBannerImage: target.bannerImage || '',
          }
        : {}),
    });
    navigate(selectedType === 'brand' ? '/campaign/new/brand-details' : '/campaign/new/audience-targeting');
  };

  const adTypes = [
    { id: 'user' as AdType, title: 'Spotlighted User', description: 'Promote yourself to increase connection and visibility.', icon: <User size={48} /> },
    { id: 'event' as AdType, title: 'Featured Event', description: 'Attract more attendees to your event.', icon: <Calendar size={48} /> },
    { id: 'brand' as AdType, title: 'Promote your Brand', description: 'Boost visibility for your business or organization.', icon: <Building size={48} /> },
  ];

  const needsTarget = selectedType === 'user' || selectedType === 'event';

  return (
    <WizardLayout
      currentStep={1}
      totalSteps={3}
      onNext={handleNext}
      nextDisabled={!campaignName || !selectedType || (needsTarget && !target)}
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
                onSelect={() => handleSelectType(type.id)}
              />
            ))}
          </div>

          {needsTarget && (
            <div className={styles.targetPicker}>
              <Button variant="outline" onClick={() => setPickerOpen(true)}>
                {target ? 'Change' : selectedType === 'user' ? 'Choose profile' : 'Choose event'}
              </Button>

              {target && (
                <div className={styles.targetCard}>
                  <div className={styles.targetAvatar}>
                    {isUserTarget(target) ? (
                      target.avatar ? <img src={target.avatar} alt={target.name} className={styles.targetAvatarImg} /> : <User size={20} />
                    ) : (
                      target.bannerImage ? <img src={target.bannerImage} alt={target.name} className={styles.targetAvatarImg} /> : <Calendar size={20} />
                    )}
                  </div>
                  <div className={styles.targetInfo}>
                    <span className={styles.targetName}>{target.name}</span>
                    <span className={styles.targetMeta}>
                      {isUserTarget(target) ? target.company || '' : target.address || ''}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedType === 'user' && (
        <TargetPickerModal
          mode="user"
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelectUser={(result) => { setTarget(result); setPickerOpen(false); }}
        />
      )}
      {selectedType === 'event' && (
        <TargetPickerModal
          mode="event"
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelectEvent={(result) => { setTarget(result); setPickerOpen(false); }}
        />
      )}
    </WizardLayout>
  );
}
